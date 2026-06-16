import os
import math
import random
import ctypes
import winsound
import threading
from PyQt6.QtWidgets import QWidget, QLabel, QApplication
from PyQt6.QtCore import Qt, QPoint, QTimer, pyqtSignal
from PyQt6.QtGui import QPixmap, QPainter, QColor, QPen, QBrush, QFont
from window_tracker import get_floor_y_for_rect


# ── 비눗방울 파티클 오버레이 (전체 화면) ─────────────────────────────────────
class BubbleOverlay(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        screen = QApplication.primaryScreen().geometry()
        self.setGeometry(0, 0, screen.width(), screen.height())
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        self.setStyleSheet("background: transparent;")

        self.bubbles = []
        self.frame = 0

        self.spawn_timer = QTimer(self)
        self.spawn_timer.timeout.connect(self.spawn_bubble)
        self.spawn_timer.start(200)  # 200ms마다 새 방울 생성

        self.update_timer = QTimer(self)
        self.update_timer.timeout.connect(self.tick)
        self.update_timer.start(16)  # ~60fps

    def spawn_bubble(self):
        screen = QApplication.primaryScreen().geometry()
        x = random.randint(50, screen.width() - 50)
        r = random.randint(8, 22)
        speed = random.uniform(1.5, 3.5)
        life = random.randint(60, 180)  # 프레임 수 (1~3초 @ 60fps)
        phase = random.uniform(0, math.pi * 2)
        amp = random.uniform(15, 35)
        self.bubbles.append({
            "x": float(x), "y": float(screen.height()),
            "r": r, "speed": speed,
            "life": life, "age": 0,
            "phase": phase, "amp": amp,
            "popping": False, "pop_frame": 0
        })

    def tick(self):
        self.frame += 1
        screen = QApplication.primaryScreen().geometry()
        alive = []
        for b in self.bubbles:
            b["age"] += 1
            b["y"] -= b["speed"]
            b["x"] += math.sin(b["phase"] + b["age"] * 0.08) * b["amp"] * 0.05
            if b["y"] < -b["r"] or b["age"] >= b["life"]:
                b["popping"] = True
            if b["popping"]:
                b["pop_frame"] += 1
                if b["pop_frame"] < 5:
                    alive.append(b)
            else:
                alive.append(b)
        self.bubbles = alive
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        for b in self.bubbles:
            if b["popping"]:
                # 팡! 터짐 효과 - 퍼지는 원
                pf = b["pop_frame"]
                pop_r = b["r"] + pf * 4
                c = QColor(200, 220, 255, max(0, 180 - pf * 45))
                painter.setPen(QPen(c, 2))
                painter.setBrush(Qt.BrushStyle.NoBrush)
                painter.drawEllipse(int(b["x"] - pop_r), int(b["y"] - pop_r), pop_r * 2, pop_r * 2)
            else:
                r = b["r"]
                alpha = min(180, int(180 * (1 - b["age"] / b["life"])))
                # 방울 테두리
                painter.setPen(QPen(QColor(150, 200, 255, alpha), 2))
                painter.setBrush(QBrush(QColor(220, 240, 255, max(0, alpha // 5))))
                painter.drawEllipse(int(b["x"] - r), int(b["y"] - r), r * 2, r * 2)
                # 하이라이트
                painter.setPen(Qt.PenStyle.NoPen)
                painter.setBrush(QBrush(QColor(255, 255, 255, alpha // 2)))
                painter.drawEllipse(int(b["x"] - r // 2), int(b["y"] - r * 0.7), r // 2, r // 3)
        painter.end()

    def stop(self):
        self.spawn_timer.stop()
        self.update_timer.stop()
        # 남은 방울 팡 처리
        for b in self.bubbles:
            b["popping"] = True
        QTimer.singleShot(300, self.hide)

SEQUENCES = {
    "run-left": {
        "start": ["run-left/return-right-1.png", "run-left/leftside-2.png", "run-left/sit-down-2.1.png", "run-left/tail-return-3.png", "run-left/tail-return-and-jump-4.png"],
        "loop": ["run-left/downjump-5.png", "run-left/honest-jump-6.png"],
        "end": ["run-left/tail-return-and-jump-4.png", "run-left/tail-return-3.png", "run-left/sit-down-2.1.png", "run-left/leftside-2.png", "run-left/return-right-1.png"]
    },
    "run-right": {
        "start": ["run-right/return-left-1.png", "run-right/rightside-2.png", "run-right/sit-down-2.1.png", "run-right/tail-return-3.png", "run-right/tail-return-and-jump-4.png"],
        "loop": ["run-right/downjump-5.png", "run-right/honest-jump-6.png"],
        "end": ["run-right/tail-return-and-jump-4.png", "run-right/tail-return-3.png", "run-right/sit-down-2.1.png", "run-right/rightside-2.png", "run-right/return-left-1.png"]
    },
    "pat-pat": {
        "start": ["pat-pat/wink-1.png"],
        "loop": ["pat-pat/wink-left-tilt.png", "pat-pat/wink-right-tilt.png", "pat-pat/wink-midle-3.png", "pat-pat/wink-right-tilt.png", "pat-pat/wink-left-tilt.png"],
        "end": ["pat-pat/wink-1.png"]
    },
    "blink": {
        "start": ["blink/blink.png", "blink/blink.png", "blink/blink.png"],
        "loop": [],
        "end": []
    },
    "mouth-closed": {
        "start": ["mouth-closed/mouth-closed.png", "basic.png", "mouth-closed/mouth-closed.png"],
        "loop": [],
        "end": []
    },
    "swing": {
        "start": ["swing/lifted.png"],
        "loop": ["swing/swing-left.png", "swing/lifted.png", "swing/swing-right.png", "swing/lifted.png"],
        "end": []
    }
}

class PetWindow(QWidget):
    patted = pyqtSignal()
    tutorial_bag_opened = pyqtSignal()
    tutorial_finished = pyqtSignal()

    def __init__(self):
        super().__init__()
        self.dragging = False
        self.drag_start_pos = None
        self.drag_state_locked = False
        self.offset = QPoint()
        self.velocity_y = 0.0
        self.velocity_x = 0.0
        self.gravity = 0.5
        
        self.state = "basic"
        self.anim_stage = "start"
        self.anim_idx = 0
        self.target_x = None
        self.hover_amount = 0
        # 성장 및 호감도 상태
        self.level = 1
        self.affection = 0
        self.current_costume = None  # costume identifier

        # 목욕 상태 관련
        self._cleaning = False
        self._foam_label = None
        self._bubble_overlay = None
        self._clean_timer = None
        self._foam_anim_timer = None
        self._foam_frame = 0
        
        self.base_dir = r"c:\antigravity\pet-link\dedenne\assets\dedenne-image"
        self.sound_dir = r"c:\antigravity\pet-link\dedenne\assets\dedenne-sound"
        self.cache = {}
        self._speaking = False  # 입 뻥긋뻥긋 타이머 제어용
        
        # 상황별 사운드 매핑
        self.SOUNDS = {
            "greet":    ["안녕 난 데덴네.wav", "난 데덴네야!.wav"],
            "idle":     ["혼자 잘 노는 중.wav", "혼자 신나게 노는 데덴네.wav"],
            "run":      ["뾱뾱 (데덴네 다니는 소리).wav"],
            "swing":    ["꺅ㄱ!.wav", "놀랐어!.wav", "헉 어떻게ㅔ.wav"],
            "pat":      ["기분 좋아ㅏ.wav", "기분 좋아 ㅎㅎ.wav", "아싸.wav", "아주 즐거워ㅓ.wav"],

            "explore":  ["거기 누구 있어.wav", "이것좀 봐봐.wav", "우와... 이것좀 봐봐.wav"],
            "excited":  ["신나ㅏㅏㅏ!!!!.wav", "엄청엄청 신나ㅏㅏ.wav", "우와ㅏㅏ.wav", "우왓!.wav"],
            "sad":      ["속상해ㅠ.wav", "울기 1보 직전.wav", "뿌에엥ㅇ.wav", "뿌에엥유ㅠ.wav"],
            "owner":    ["주인아!!!!.wav", "혼자 놀다가 마지막에 주인 발견!.wav"],
        }
        
        self.initUI()
        
    def initUI(self):
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.setStyleSheet("QWidget { background: transparent; }")
        self.setWindowTitle("DedennePet")
        
        # Mouse tracking for pat-pat
        self.setMouseTracking(True)
        
        screen = QApplication.primaryScreen().geometry()
        self.screen_width = screen.width()
        self.screen_height = screen.height()
        
        # Set generous window size for images
        self.setGeometry(300, 100, 250, 250)
        
        self.label = QLabel(self)
        self.label.setGeometry(0, 0, 250, 250)
        self.label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.label.setMouseTracking(True)
        self.label.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.label.setStyleSheet("background:transparent;")
        
        self.set_image("basic.png")
        
        # Speech Bubble
        self.speech_bubble = QLabel(self)
        self.speech_bubble.setStyleSheet("""
            QLabel {
                background-color: white;
                color: black;
                border: 2px solid #ccc;
                border-radius: 10px;
                padding: 5px 10px;
                font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
                font-weight: bold;
                font-size: 12px;
            }
        """)
        self.speech_bubble.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.speech_bubble.hide()
        
        # Physics timer (60 FPS)
        self.phys_timer = QTimer(self)
        self.phys_timer.timeout.connect(self.update_physics)
        self.phys_timer.start(16)
        
        # Animation timer
        self.anim_timer = QTimer(self)
        self.anim_timer.timeout.connect(self.update_animation)
        self.anim_timer.start(250) # 250ms per frame (느긋한 데덴네)
        # 옷 입힘 오버레이 레이블 (투명)
        self.costume_label = QLabel(self)
        self.costume_label.setGeometry(0, 0, 250, 250)
        self.costume_label.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        self.costume_label.setStyleSheet("background:transparent;")

        # 거품 오버레이 레이블 (목욕 중에만 표시)
        self._foam_label = QLabel(self)
        self._foam_label.setGeometry(0, 0, 250, 250)
        self._foam_label.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        self._foam_label.setStyleSheet("background:transparent;")
        self._foam_label.hide()

        # 튜토리얼 커서 레이블
        self._tutorial_cursor_label = QLabel(self)
        self._tutorial_cursor_label.setGeometry(0, 0, 250, 250)
        self._tutorial_cursor_label.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents)
        self._tutorial_cursor_label.setStyleSheet("background:transparent;")
        self._tutorial_cursor_label.hide()
        
        self.tutorial_complete = True
        self.tutorial_step = 0
        self._tutorial_blink_timer = None

    def showEvent(self, event):
        super().showEvent(event)
        self._disable_win11_backdrop()
        # 처음 등장할 때 인사 사운드
        QTimer.singleShot(300, lambda: self.play_sound("greet"))

    def play_sound(self, category, chance=0.4):
        """카테고리에서 랜덤으로 사운드를 골라 재생 (winsound, 비동기)"""
        if random.random() > chance:
            return  # 확률적으로 소리 안 내기
        self.stop_sound()  # 이전 소리 먼저 끊기
        files = self.SOUNDS.get(category, [])
        if not files:
            return
        fname = random.choice(files)
        path = os.path.join(self.sound_dir, fname)
        if not os.path.exists(path):
            print(f"사운드 파일 없음: {path}")
            return
        # 별도 스레드에서 재생해서 UI 안 멈추게
        def _play():
            try:
                winsound.PlaySound(path, winsound.SND_FILENAME)
            except Exception as e:
                print(f"사운드 오류: {e}")
        threading.Thread(target=_play, daemon=True).start()

    def stop_sound(self):
        """현재 재생 중인 소리 즉시 중단"""
        try:
            winsound.PlaySound(None, 0)
        except Exception:
            pass

    def _disable_win11_backdrop(self):
        try:
            hwnd = int(self.winId())
            print(f"hwnd: {hwnd}")  # 0이면 아직 창이 안 만들어진 것
            result1 = ctypes.windll.dwmapi.DwmSetWindowAttribute(
                hwnd, 38, ctypes.byref(ctypes.c_int(1)), 4
            )
            result2 = ctypes.windll.dwmapi.DwmSetWindowAttribute(
                hwnd, 33, ctypes.byref(ctypes.c_int(1)), 4
            )
            print(f"DWM 결과: {result1}, {result2}")  # 0이면 성공
        except Exception as e:
            print(f"DWM 오류: {e}")

    def set_image(self, name):
        if name not in self.cache:
            path = os.path.join(self.base_dir, name)
            if os.path.exists(path):
                self.cache[name] = QPixmap(path)
            else:
                print(f"Missing image: {path}")
                return
        pm = self.cache[name].scaled(self.width(), self.height(), Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
        self.label.setPixmap(pm)

    def speak(self, text, duration=2000):
        self.speech_bubble.setText(text)
        self.speech_bubble.adjustSize()
        bw = self.speech_bubble.width()
        # Position bubble above center
        self.speech_bubble.move(125 - bw // 2, 20)
        self.speech_bubble.show()
        
        # 입 뾵굿뾵굿 애니메이션
        self._speaking = True
        self._mouth_open = True
        self._mouth_timer = QTimer(self)
        self._mouth_timer.timeout.connect(self._toggle_mouth)
        self._mouth_timer.start(350)  # 350ms마다 입 토글 (느긋하게)
        
        def _stop_speaking():
            self._speaking = False
            self._mouth_timer.stop()
            self.speech_bubble.hide()
            # 현재 상태에 맞는 이미지로 복구
            if self.state == "basic":
                self.set_image("basic.png")
        QTimer.singleShot(duration, _stop_speaking)

    def add_affection(self, amount: int):
        """Add affection points and handle level‑up."""
        self.affection += amount
        if self.affection >= 100:
            self.level += 1
            self.affection = 0
            self.show_level_up()
        # Notify inventory if needed (inventory reads pet.level directly)

    def show_level_up(self):
        """Display a temporary centered level‑up popup."""
        popup = QLabel(f"LEVEL UP! 🎉 데덴네가 더 행복해졌습니다!", self)
        popup.setStyleSheet("background:#e07a5f; color:white; font-size:14px; font-weight:bold; border-radius:8px; padding:8px;")
        popup.adjustSize()
        popup.move((self.width() - popup.width()) // 2, 20)
        popup.show()
        QTimer.singleShot(2000, popup.hide)
        # Unlock costume UI – inventory will query pet.level

    def apply_costume(self, costume_id: str):
        """Overlay a costume image on the pet.
        Expects PNG at assets/costumes/<costume_id>.png.
        """
        self.current_costume = costume_id
        path = f"c:\\antigravity\\pet-link\\dedenne\\assets\\costumes\\{costume_id}.png"
        if os.path.exists(path):
            pix = QPixmap(path).scaled(self.width(), self.height(), Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
            self.costume_label.setPixmap(pix)
        else:
            self.costume_label.clear()

    def _toggle_mouth(self):
        """말하는 동안 입 열기/닫기 토글 (basic 상태에서만)"""
        if not self._speaking or self.state != "basic":
            return
        if self._mouth_open:
            self.set_image("mouth-closed/mouth-closed.png")
        else:
            self.set_image("basic.png")
        self._mouth_open = not self._mouth_open

    def start_cleaning(self):
        """목욕(CLEANING) 상태 시작 - 5초 후 자동 복귀"""
        if self._cleaning:
            return
        self._cleaning = True
        self.state = "cleaning"
        self.velocity_x = 0.0

        # 말풍선
        messages = ["🧼 깨끗해져요~", "🛁 냠냠... 목욕중!", "✨ 뽀득뽀득!"]
        self.speak(random.choice(messages), duration=4500)

        # 거품 오버레이 애니메이션 시작
        self._foam_frame = 0
        self._foam_label.show()
        self._foam_label.raise_()
        self._draw_foam()
        self._foam_anim_timer = QTimer(self)
        self._foam_anim_timer.timeout.connect(self._animate_foam)
        self._foam_anim_timer.start(120)

        # 비눗방울 파티클 오버레이
        self._bubble_overlay = BubbleOverlay()
        self._bubble_overlay.show()

        # 5초 후 자동 종료
        self._clean_timer = QTimer(self)
        self._clean_timer.setSingleShot(True)
        self._clean_timer.timeout.connect(self._end_cleaning)
        self._clean_timer.start(5000)

    def _draw_foam(self):
        """QPainter로 거품 이미지를 동적으로 그린다"""
        from PyQt6.QtGui import QPainter, QColor, QBrush, QPen
        import math
        size = 250
        pix = QPixmap(size, size)
        pix.fill(QColor(0, 0, 0, 0))
        painter = QPainter(pix)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        t = self._foam_frame
        # 거품 원들 - 캐릭터 주변에 랜덤하게 배치되되 프레임마다 흔들림
        foam_positions = [
            (90 + math.sin(t * 0.3) * 6,  60 + math.cos(t * 0.2) * 4, 28),
            (160 + math.cos(t * 0.25) * 5, 55 + math.sin(t * 0.35) * 5, 22),
            (70 + math.sin(t * 0.4) * 4,  95 + math.cos(t * 0.3) * 6, 18),
            (180 + math.cos(t * 0.3) * 6, 90 + math.sin(t * 0.2) * 4, 20),
            (125 + math.sin(t * 0.5) * 8,  45 + math.cos(t * 0.4) * 5, 25),
            (105 + math.cos(t * 0.2) * 5, 120 + math.sin(t * 0.3) * 3, 15),
            (150 + math.sin(t * 0.35) * 4, 115 + math.cos(t * 0.25) * 5, 17),
        ]
        for (cx, cy, r) in foam_positions:
            painter.setPen(QPen(QColor(200, 220, 255, 160), 2))
            painter.setBrush(QBrush(QColor(240, 248, 255, 200)))
            painter.drawEllipse(int(cx - r), int(cy - r), r * 2, r * 2)
            # 하이라이트
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(QColor(255, 255, 255, 220)))
            painter.drawEllipse(int(cx - r // 3), int(cy - r * 0.6), r // 2, r // 3)
        painter.end()
        self._foam_label.setPixmap(pix)

    def _animate_foam(self):
        self._foam_frame += 1
        self._draw_foam()
        # 거품 레이블이 캐릭터 위치를 계속 추적
        self._foam_label.setGeometry(0, 0, self.width(), self.height())

    def _end_cleaning(self):
        self._cleaning = False
        self.state = "basic"
        if self._foam_anim_timer:
            self._foam_anim_timer.stop()
        self._foam_label.hide()
        if self._bubble_overlay:
            self._bubble_overlay.stop()
            self._bubble_overlay = None
        self.set_image("basic.png")

    def start_tutorial(self):
        self.tutorial_complete = False
        self.tutorial_step = 1
        self.speak("가방을 열려면 데덴네를 왼쪽 클릭해봐!", duration=99999)
        self._tutorial_cursor_label.show()
        self._tutorial_blink_timer = QTimer(self)
        self._tutorial_blink_timer.timeout.connect(self._animate_tutorial_cursor)
        self._tutorial_blink_timer.start(500)

    def _animate_tutorial_cursor(self):
        if not hasattr(self, '_cursor_visible'):
            self._cursor_visible = True
        self._cursor_visible = not self._cursor_visible
        
        pix = QPixmap(self.width(), self.height())
        pix.fill(QColor(0,0,0,0))
        if self._cursor_visible:
            from PyQt6.QtGui import QPainter, QColor, QPen, QBrush, QPolygon
            painter = QPainter(pix)
            painter.setRenderHint(QPainter.RenderHint.Antialiasing)
            painter.setBrush(QBrush(QColor(255, 255, 0, 180)))
            painter.setPen(QPen(QColor(255, 0, 0), 2))
            # Draw a simple arrow cursor pointing at center
            cx, cy = self.width() // 2, self.height() // 2
            poly = QPolygon([QPoint(cx, cy), QPoint(cx+15, cy+30), QPoint(cx+30, cy+15)])
            painter.drawPolygon(poly)
            painter.end()
        self._tutorial_cursor_label.setPixmap(pix)

    def _finish_tutorial(self):
        self.tutorial_complete = True
        self.tutorial_finished.emit()

    def change_state(self, new_state):
        if self.state == new_state: return
        self.state = new_state
        self.anim_stage = "start"
        self.anim_idx = 0
        
        if new_state == "run-left":
            self.velocity_x = -3.0
            self.target_x = self.x() - random.randint(150, 400)
            self.play_sound("run", chance=0.3)
        elif new_state == "run-right":
            self.velocity_x = 3.0
            self.target_x = self.x() + random.randint(150, 400)
            self.play_sound("run", chance=0.3)
        elif new_state == "swing":
            self.velocity_x = 0.0
            self.velocity_y = 0.0
            self.play_sound("swing", chance=1.0)
            messages = ["뎨...! (앗! 깜짝이야!)", "데덴! (하늘을 난다!)", "네-네? (어디 가?)"]
            self.speak(random.choice(messages))
        elif new_state == "pat-pat":
            self.play_sound("pat", chance=0.5)
            messages = ["데덴~ (기분 좋아~)", "찌릿... (간지러워~)", "네네- (더 쓰다듬어줘!)"]
            self.speak(random.choice(messages))

    def finish_state(self):
        self.stop_sound()  # 행동 끝나면 소리도 끊기
        self.state = "basic"
        self.anim_idx = 0
        self.anim_stage = "start"
        self.set_image("basic.png")
        self.velocity_x = 0.0

    def should_end_loop(self):
        if self.state == "run-left":
            return self.x() <= getattr(self, "target_x", -9999)
        elif self.state == "run-right":
            return self.x() >= getattr(self, "target_x", 9999)
        elif self.state == "pat-pat":
            return self.hover_amount <= 0
        elif self.state == "swing":
            return not self.dragging
        return True

    def update_animation(self):
        if self.state == "cleaning":
            # 목욕 중엔 basic 이미지 유지 (거품 오버레이가 위에 표시됨)
            self.set_image("basic.png")
            return

        if self.state == "basic":
            self.set_image("basic.png")
            # Random autonomous actions when idle
            if random.random() < 0.02 and self.velocity_y == 0:
                action = random.choice(["blink", "mouth-closed", "run-left", "run-right", "speak"])
                if action == "speak":
                    messages = [
                        "데-덴-네-네네! (안녕!)", 
                        "찌-리-릿! (놀아줘!)", 
                        "데넨네! (심심해~)", 
                        "네-네- (오늘도 화이팅!)"
                    ]
                    self.play_sound("idle", chance=0.5)
                    self.speak(random.choice(messages))
                else:
                    self.change_state(action)
            return

        if self.state == "falling":
            self.set_image("swing/lifted.png")
            return
            
        seq = SEQUENCES.get(self.state)
        if not seq:
            self.finish_state()
            return
            
        stage_frames = seq[self.anim_stage]
        if self.anim_idx < len(stage_frames):
            self.set_image(stage_frames[self.anim_idx])
            self.anim_idx += 1
        else:
            if self.anim_stage == "start":
                if seq["loop"]:
                    self.anim_stage = "loop"
                    self.anim_idx = 0
                    self.update_animation()
                else:
                    self.finish_state()
            elif self.anim_stage == "loop":
                if self.should_end_loop():
                    if seq["end"]:
                        self.anim_stage = "end"
                        self.anim_idx = 0
                        self.update_animation()
                    else:
                        self.finish_state()
                else:
                    self.anim_idx = 0
                    self.update_animation()
            elif self.anim_stage == "end":
                self.finish_state()

    def update_physics(self):
        # Decay hover over time
        if self.hover_amount > 0:
            self.hover_amount -= 5

        if self.dragging:
            return
            
        current_y = self.y()
        self.velocity_y += self.gravity
        next_y = current_y + int(self.velocity_y)
        next_x = self.x() + int(self.velocity_x)
        
        pet_rect = (next_x, next_y, next_x + self.width(), next_y + self.height())
        floor_y = get_floor_y_for_rect(pet_rect)
        
        feet_margin = 35  # Adjust this to eliminate the floating gap!
        
        on_ground = False
        if floor_y is not None and next_y + self.height() - feet_margin >= floor_y:
            next_y = floor_y - self.height() + feet_margin
            self.velocity_y = 0.0
            on_ground = True
        elif next_y + self.height() >= self.screen_height:
            next_y = self.screen_height - self.height()
            self.velocity_y = 0.0
            on_ground = True
        if not on_ground and self.velocity_y > 2 and self.state not in ["swing", "falling"]:
            self.change_state("falling")
            
            
        if self.state == "falling" and on_ground:
            self.finish_state()
            
        self.move(next_x, next_y)
        
        # 화면 밖(완전히 벗어났을 때)으로 나가면 프로그램 자동 종료
        if (next_x + self.width() < -20) or (next_x > self.screen_width + 20) or (next_y > self.screen_height + 20) or (next_y + self.height() < -20):
            app = QApplication.instance()
            if app:
                app.quit()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.dragging = True
            self.drag_start_pos = event.globalPosition()
            self.offset = event.globalPosition().toPoint() - self.pos()
            self.drag_state_locked = False
            self.velocity_x = 0.0
            self.velocity_y = 0.0
            event.accept()

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.dragging = False
            self.drag_state_locked = False
            
            # 튜토리얼 1단계: 클릭 시 가방 열기 연출
            if not getattr(self, "tutorial_complete", True) and getattr(self, "tutorial_step", 0) == 1:
                if self.drag_start_pos is not None:
                    dy = event.globalPosition().y() - self.drag_start_pos.y()
                    dx = event.globalPosition().x() - self.drag_start_pos.x()
                    if abs(dy) < 5 and abs(dx) < 5:
                        self.tutorial_step = 2
                        if self._tutorial_blink_timer:
                            self._tutorial_blink_timer.stop()
                        self._tutorial_cursor_label.hide()
                        self.tutorial_bag_opened.emit()
                        # 2단계 안내
                        self.speak("여기서 식빵과 딸기를 먹이거나 씻길 수 있어!", duration=2000)
                        QTimer.singleShot(2000, self._finish_tutorial)

            self.drag_start_pos = None
            
            # 마우스를 놓는 순간 모든 속도와 회전 각도 상태를 제로(0)로 강제 초기화
            self.velocity_x = 0.0
            self.velocity_y = 0.0
            
            # 삐딱하게 걷는 버그 방지: 상태를 즉시 순수한 기본 상태로 리셋
            if self.state in ["swing", "falling", "pat-pat"]:
                self.finish_state()
            else:
                self.state = "basic"
                self.set_image("basic.png")
                
            event.accept()

    def mouseMoveEvent(self, event):
        if self.dragging:
            if self.drag_start_pos is None:
                return
            
            # 현재 마우스 위치로 창 이동
            current_global_pos = event.globalPosition().toPoint()
            self.move(current_global_pos - self.offset)
            
            dy = event.globalPosition().y() - self.drag_start_pos.y()
            
            if not self.drag_state_locked:
                # 위로 20픽셀 이상 들어 올리면 공중에 매달린(swing) 모션 작동
                if dy < -20:
                    self.drag_state_locked = True
                    self.change_state("swing")
            event.accept()
