import sys
import os
import json
import datetime
from PyQt6.QtWidgets import (
    QApplication, QSystemTrayIcon, QMenu,
    QWidget, QVBoxLayout, QLabel, QPushButton, QHBoxLayout, QTabWidget,
    QProgressBar
)
from PyQt6.QtGui import QIcon, QAction
from PyQt6.QtCore import Qt, QObject, QEvent, QTimer, QFileSystemWatcher
from pet_window import PetWindow

# Attempt to import Supabase client; will be None if not installed
try:
    from supabase import create_client
except ImportError:
    create_client = None  # runtime check later

class InventoryWindow(QWidget):
    """Inventory (Bag) and Closet UI.
    Handles heart item, level‑up display and costume selection.
    """
    def __init__(self, pet):
        super().__init__()
        self.pet = pet
        
        # 저장할 로컬 파일 경로 지정 (main.py와 같은 폴더의 pet_data.json)
        self.save_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pet_data.json")
        # ── 내부 상태값 ──────────────────────────────
        self.affection: int = 0
        self.level: int = 1
        self.current_costume: str = "default"
        self.last_pat_date: str = ""
        self.tutorial_complete: bool = False
        self._is_saving = False  # 파일 저장 중인지 체크하는 플래그
        
        # 파일 시스템 와처 설정 (외부에서 json 변경 시 자동 로드)
        self.watcher = QFileSystemWatcher(self)
        if os.path.exists(self.save_file):
            self.watcher.addPath(self.save_file)
        self.watcher.fileChanged.connect(self._on_file_changed)
        
        # 쓰담쓰담 이벤트 연결
        self.pet.patted.connect(self.handle_pat_pat)

        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.Tool |
            Qt.WindowType.WindowStaysOnTopHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

        # ---- UI Layout ----
        container = QWidget(self)
        container.setObjectName("InventoryMain")
        container.setStyleSheet(
            """
            QWidget#InventoryMain {
                background-color: #fdf6e3;
                border: 3px solid #4a3525;
                border-radius: 15px;
            }
            QLabel {font-family: 'Malgun Gothic', sans-serif; color: #4a2e1b;}
            QPushButton {background-color: #e07a5f; color: white; font-weight: bold; border-radius: 8px; padding: 5px 10px;}
            QPushButton:hover {background-color: #d56b50;}
            QPushButton:disabled {background-color: #e8dac1; color: #a68a7e;}
            """
        )
        outer_layout = QVBoxLayout(self)
        outer_layout.setContentsMargins(0, 0, 0, 0)
        outer_layout.addWidget(container)

        main_layout = QVBoxLayout(container)
        main_layout.setContentsMargins(10, 10, 10, 10)

        # Header with close button
        header = QHBoxLayout()
        title = QLabel("🎒 내 가방")
        title.setStyleSheet("font-size: 16px; font-weight: bold;")
        header.addWidget(title)
        header.addStretch()
        close_btn = QPushButton("✖")
        close_btn.setFixedSize(24, 24)
        close_btn.setStyleSheet("background: transparent; color: #4a3525; font-weight: bold;")
        close_btn.clicked.connect(self.hide)
        header.addWidget(close_btn)
        main_layout.addLayout(header)

        # ── ❤️ 호감도 게이지 바 ─────────────────────
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(self.affection)
        self.progress_bar.setFormat("❤️ %v / 100")
        self.progress_bar.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.progress_bar.setFixedHeight(26)
        self.progress_bar.setStyleSheet("""
            QProgressBar {
                background-color: #fff0f5;
                border: 2px solid #4a3525;
                border-radius: 10px;
                font-family: 'Malgun Gothic', sans-serif;
                font-size: 12px;
                font-weight: bold;
                color: #4a2e1b;
                text-align: center;
            }
            QProgressBar::chunk {
                background-color: #ff4d6d;
                border-radius: 8px;
            }
        """)
        main_layout.addWidget(self.progress_bar)

        # Tab widget for Bag & Closet
        self.tabs = QTabWidget()
        self.tabs.setStyleSheet(
            "QTabBar::tab {padding: 6px 12px; margin-right: 2px;} "
            "QTabBar::tab:selected {background: #e07a5f; color: white; border-radius: 5px;}"
        )
        main_layout.addWidget(self.tabs)

        # ----- Bag Tab -----
        bag_tab = QWidget()
        bag_layout = QVBoxLayout(bag_tab)
        # ----- 아이템 목록 (식빵, 비누) -----
        # affection_gain: 아이템 사용 시 증가하는 호감도 점수
        self.items = [
            {"id": "bread", "name": "🍞 맛있는 식빵", "quantity": 3, "message": "냠냠! 배고파요!",  "affection_gain": 10},
            {"id": "soap",  "name": "🧼 몽글몽글 비누","quantity": 1, "message": "깨끗해져요!",    "affection_gain":  5},
        ]
        self.item_widgets = {}
        for idx, item in enumerate(self.items):
            row = QHBoxLayout()
            label = QLabel(f"{item['name']} ({item['quantity']}개)")
            label.setStyleSheet("font-size: 13px;")
            btn = QPushButton("사용하기")
            btn.setEnabled(item['quantity'] > 0)
            btn.clicked.connect(lambda checked, i=idx, it=item: self.use_item(i, it))
            row.addWidget(label)
            row.addWidget(btn)
            bag_layout.addLayout(row)
            self.item_widgets[idx] = {"label": label, "btn": btn, "item": item}
        self.tabs.addTab(bag_tab, "👜 가방")

        # ----- Closet Tab -----
        closet_tab = QWidget()
        closet_layout = QVBoxLayout(closet_tab)
        self.costume_buttons = {}
        # Define unlockable costumes per level
        self.costume_defs = {
            3: {"id": "ribbon", "name": "귀여운 빨간 리본", "icon": "ribbon.png"},
            5: {"id": "hat", "name": "멋쟁이 노란 모자", "icon": "hat.png"},
        }
        for lvl, info in self.costume_defs.items():
            btn = QPushButton(f"{info['name']} (레벨 {lvl} 해금)")
            btn.setEnabled(False)
            btn.clicked.connect(lambda checked, cid=info['id']: self.apply_costume(cid))
            self.costume_buttons[info['id']] = btn
            closet_layout.addWidget(btn)
        self.tabs.addTab(closet_tab, "👕 옷장")

        self.resize(320, 230)
        # Position sync timer (follow pet)
        self.sync_timer = QTimer(self)
        self.sync_timer.timeout.connect(self.sync_position)
        self.sync_timer.start(16)

        self.load_stats()

    # ------------------------------------------------------------------
    # 로컬 JSON 데이터 저장 / 불러오기
    # ------------------------------------------------------------------
    def _on_file_changed(self, path):
        """외부 프로세스(Next.js 등)가 파일을 변경했을 때 호출됨."""
        if not self._is_saving:
            print("[FileWatcher] pet_data.json changed externally. Reloading...")
            self.load_stats()

    def load_stats(self):
        """앱 시작 시 또는 파일 변경 시 로컬 json 파일에서 데이터를 불러와 UI를 초기화한다."""
        if os.path.exists(self.save_file):
            try:
                with open(self.save_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    
                self.level = data.get("level", 1)
                self.affection = data.get("affection", 0)
                self.current_costume = data.get("current_costume", "default")
                self.last_pat_date = data.get("last_pat_date", "")
                self.tutorial_complete = data.get("tutorial_complete", False)
                
                # 가방 아이템 수량 복원
                qty_map = data.get("inventory", {})
                for item in self.items:
                    item["quantity"] = qty_map.get(item["id"], 0)
                        
                # pet 오브젝트 동기화
                self.pet.level = self.level
                self.pet.affection = self.affection
                if self.current_costume and self.current_costume != "default":
                    self.pet.apply_costume(self.current_costume)
                self.update_costume_unlocks()
            except Exception as e:
                print("[JSON Load Error]", e)

        # ── UI 전체 갱신 ────────────────────────────────────────────
        self.update_all_items_ui()
        self.progress_bar.setValue(self.affection)
        self.progress_bar.setFormat(f"❤️ {self.affection} / 100")

        # 튜토리얼 진행 안했으면 1초 뒤 시작
        if not self.tutorial_complete:
            QTimer.singleShot(1000, self.pet.start_tutorial)

    def _save_to_file(self):
        """현재 상태를 JSON 파일로 저장한다."""
        self._is_saving = True  # 와처 무시 플래그 ON
        qty_map = {item["id"]: item["quantity"] for item in self.items}
        data = {
            "level": self.level,
            "affection": self.affection,
            "current_costume": self.current_costume,
            "last_pat_date": self.last_pat_date,
            "tutorial_complete": self.tutorial_complete,
            "inventory": qty_map
        }
        try:
            with open(self.save_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
        except Exception as e:
            print("[JSON Save Error]", e)
            
        # 100ms 후 플래그 해제 (파일 쓰기 완료 후 이벤트 처리 딜레이 고려)
        QTimer.singleShot(100, self._reset_saving_flag)

    def _reset_saving_flag(self):
        self._is_saving = False

    def sync_stats(self):
        """상태 변경 시 파일 저장"""
        self._save_to_file()

    def sync_inventory(self, item_id: str, quantity: int):
        """인벤토리 변경 시 파일 저장"""
        self._save_to_file()

    # ------------------------------------------------------------------
    # UI Helpers
    # ------------------------------------------------------------------
    def sync_position(self):
        if self.isVisible():
            self.move(self.pet.x() + self.pet.width() - 30, self.pet.y() + 20)

    def update_all_items_ui(self):
        """모든 아이템 레이블과 버튼 상태를 갱신한다."""
        for idx, widget in self.item_widgets.items():
            item = widget["item"]
            widget["label"].setText(f"{item['name']} ({item['quantity']}개)")
            widget["btn"].setEnabled(item["quantity"] > 0)

    def use_item(self, idx, item):
        """아이템 사용: 수량 -1 → DB 즉시 차감 → 호감도 상승 → 게이지 갱신."""
        if item["quantity"] <= 0:
            return

        # ── 수량 차감 ──────────────────────────────────────────────────
        item["quantity"] -= 1
        self.update_all_items_ui()

        # ── [BUG FIX 2 & 3] user_inventory에 즉시 반영 ─────────────────
        self.sync_inventory(item["id"], item["quantity"])

        # ── [BUG FIX 1] 아이템별 호감도 차등 증가 ──────────────────────
        gain = item.get("affection_gain", 0)  # heart:20 / bread:10 / soap:5
        if gain > 0:
            self.affection += gain
            leveled_up = False
            if self.affection >= 100:
                self.level += 1
                self.affection = 0
                leveled_up = True

            # pet 오브젝트 동기화
            self.pet.affection = self.affection
            self.pet.level     = self.level

            # ProgressBar 즉시 갱신
            self.progress_bar.setValue(self.affection)
            self.progress_bar.setFormat(f"❤️ {self.affection} / 100")

            if leveled_up:
                self.pet.show_level_up()
                self.update_costume_unlocks()

        # 펫 말풍선
        self.pet.speak(item["message"], duration=1500)

        # 비누 사용 시 목욕 시작
        if item["id"] == "soap":
            self.pet.start_cleaning()

        # ── [BUG FIX 3] user_stats에도 즉시 저장 ──────────────────────
        self.sync_stats()

    def handle_pat_pat(self):
        """쓰담쓰담 시 하루에 1번 호감도 5 증가"""
        today_str = datetime.date.today().isoformat()
        if self.last_pat_date != today_str:
            self.last_pat_date = today_str
            self.affection += 5
            
            leveled_up = False
            if self.affection >= 100:
                self.level += 1
                self.affection = 0
                leveled_up = True

            self.pet.affection = self.affection
            self.pet.level = self.level

            self.progress_bar.setValue(self.affection)
            self.progress_bar.setFormat(f"❤️ {self.affection} / 100")

            if leveled_up:
                self.pet.show_level_up()
                self.update_costume_unlocks()
                
            self.sync_stats()
            self.pet.speak("💖 기분 좋아!", duration=1500)

    def add_item(self, item_id: str, qty: int = 1):
        """외부(웹 구매 등)에서 특정 아이템 수량을 추가할 때 호출."""
        for item in self.items:
            if item["id"] == item_id:
                item["quantity"] += qty
                break
        self.update_all_items_ui()
        self.sync_stats()

    def update_costume_unlocks(self):
        for cid, btn in self.costume_buttons.items():
            lvl_req = next(l for l, d in self.costume_defs.items() if d['id'] == cid)
            btn.setEnabled(self.pet.level >= lvl_req)

    def apply_costume(self, costume_id):
        self.pet.apply_costume(costume_id)
        self.sync_stats()
        # after applying a costume we also want to unlock further ones if level changed
        self.update_costume_unlocks()

    def handle_tutorial_opened(self):
        if not self.tutorial_complete:
            self.show()
            self.sync_position()

    def handle_tutorial_finished(self):
        if not self.tutorial_complete:
            self.tutorial_complete = True
            self.sync_stats()

# ----------------------------------------------------------------------
# Event filter for right‑click menu on the pet window
# ----------------------------------------------------------------------
class PetEventFilter(QObject):
    def __init__(self, pet, inventory, app):
        super().__init__()
        self.pet = pet
        self.inventory = inventory
        self.app = app

    def eventFilter(self, obj, event):
        if event.type() == QEvent.Type.MouseButtonPress:
            if event.button() == Qt.MouseButton.RightButton:
                menu = QMenu()
                menu.setStyleSheet(
                    """
                    QMenu {background-color:#fdf6e3; border:2px solid #e8dac1; border-radius:5px; font-family:'Malgun Gothic';}
                    QMenu::item {padding:8px 20px;}
                    QMenu::item:selected {background-color:#e8dac1;}
                    """
                )
                toggle = QAction(
                    "🎒 내 가방 열기" if not self.inventory.isVisible() else "🎒 내 가방 닫기"
                )
                toggle.triggered.connect(self.toggle_inventory)
                menu.addAction(toggle)

                bath_act = QAction("🛁 목욕 시키기")
                bath_act.triggered.connect(lambda: self.pet.start_cleaning())
                menu.addAction(bath_act)

                menu.addSeparator()
                quit_act = QAction("❌ 프로그램 종료")
                quit_act.triggered.connect(self.app.quit)
                menu.addAction(quit_act)
                menu.exec(event.globalPosition().toPoint())
                return True
        return super().eventFilter(obj, event)

    def toggle_inventory(self):
        if self.inventory.isVisible():
            self.inventory.hide()
        else:
            self.inventory.show()
            self.inventory.sync_position()

# ----------------------------------------------------------------------
# Application entry point
# ----------------------------------------------------------------------
def main():
    app = QApplication(sys.argv)
    pet = PetWindow()

    inventory = InventoryWindow(pet)
    pet.tutorial_bag_opened.connect(inventory.handle_tutorial_opened)
    pet.tutorial_finished.connect(inventory.handle_tutorial_finished)

    # Attach right‑click menu handler
    event_filter = PetEventFilter(pet, inventory, app)
    pet.installEventFilter(event_filter)

    pet.show()

    # System tray (unchanged from earlier version)
    tray_icon = QSystemTrayIcon(
        QIcon(r"c:\antigravity\pet-link\dedenne\assets\dedenne-image\basic.png"), app
    )
    tray_icon.setToolTip("Dedenne Pet")
    tray_menu = QMenu()
    quit_act = QAction("종료 (Quit)")
    quit_act.triggered.connect(app.quit)
    tray_menu.addAction(quit_act)
    tray_icon.setContextMenu(tray_menu)
    tray_icon.show()

    sys.exit(app.exec())

if __name__ == '__main__':
    main()
