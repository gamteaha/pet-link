# 🤖 Pet-Link: AI Handover & Project Coordination Guide

> [!IMPORTANT]  
> **미래의 모든 AI 개발 에이전트 필독 의무 (Strict Rule for Future AIs)**  
> 1. 이 프로젝트에 투입되는 모든 AI는 작업을 시작하기 전에 반드시 이 파일을 **가장 먼저 읽어** 이전 변경 내역과 설계 규칙을 숙지해야 합니다.  
> 2. 작업을 마칠 때에는 자신이 새로 수정하거나 해결한 내용, 향후 남은 과제 및 특이사항을 본 파일 맨 아래의 **"실시간 작업 로그 (Real-time Progress Log)"**에 **반드시 직접 실시간으로 기록 및 업데이트**한 후 턴을 끝마쳐야 합니다.
> 3. **[CRITICAL] 수퍼베이스(Supabase) DB 스키마, RLS 정책, Realtime 설정 등 SQL 실행이 필요한 작업이 발생하면, AI가 직접 할 수 없으므로 무조건 1) 채팅창에 마크다운 SQL 코드로 적어주고, 2) 유저에게 직접 실행하라고 명시적으로 말하며, 3) 이 파일(AI_HANDOVER.md)에도 해당 SQL 내용과 필요성을 기록해야 합니다.**

---

## 📂 프로젝트 개요 & 아키텍처

본 프로젝트는 사용자의 화면을 돌아다니는 귀여운 데스크톱 펫 컴패니언 플랫폼 **Pet-Link**입니다. 플랫폼은 두 가지 독립된 개발 축으로 구성되어 있습니다.

```mermaid
graph TD
    Root[c:/antigravity/pet-link] --> PyApp[PyQt6 Desktop Pet: /dedenne]
    Root --> WebApp[Next.js + Electron: /dedenne-web]
    
    PyApp --> PyMain[main.py: Entry Point]
    PyApp --> PyWindow[pet_window.py: Physics & Animation]
    
    WebApp --> WebNext[Next.js Site: customize, cart, shop]
    WebApp --> ElectronApp[Electron Window: transparent & click-through]
    ElectronApp --> DesktopRoute[/desktop: renders CustomPet]
    DesktopRoute --> CustomPet[CustomPet.tsx: 3D Physics]
    CustomPet --> Character3D[Character3D.tsx: React Three Fiber 3D model]
```

### 1. 🐾 파이썬 데스크톱 앱 (`/dedenne`)
* **목표**: 2D 스프라이트 이미지를 이용한 전통적인 데스크톱 펫.
* **핵심 파일**:
  * [main.py](file:///c:/antigravity/pet-link/dedenne/main.py): PyQt6 실행 및 시스템 트레이 아이콘 설정.
  * [pet_window.py](file:///c:/antigravity/pet-link/dedenne/pet_window.py): 중력, 창틀 감지(EnumWindows), 드래그 앤 드롭 물리 연산, 사운드 재생(`winsound`) 제어.
  * [window_tracker.py](file:///c:/antigravity/pet-link/dedenne/window_tracker.py): Windows API(`win32gui`)를 사용해 화면의 활성 창들을 추적하고 펫이 창 위에 앉을 수 있게 발판 데이터를 계산.

### 2. 🌐 웹 쇼핑몰 & 일렉트론 플레이어 (`/dedenne-web`)
* **목표**: 웹에서 캐릭터를 꾸민 후 직접 다운로드하여 내 컴퓨터에서 소환할 수 있는 3D 펫 배포 플랫폼.
* **핵심 파일**:
  * [main.js](file:///c:/antigravity/pet-link/dedenne-web/main.js): Electron 메인 프로세스. 화면 크기로 창을 최대화(Maximize)하고 투명화(`transparent: true`) 및 클릭 통과(`setIgnoreMouseEvents`)를 총괄합니다.
  * [app/desktop/page.tsx](file:///c:/antigravity/pet-link/dedenne-web/app/desktop/page.tsx): Electron 창이 로드하는 경로. 투명화 클래스(`.desktop-mode`)를 활성화합니다.
  * [app/components/CustomPet.tsx](file:///c:/antigravity/pet-link/dedenne-web/app/components/CustomPet.tsx): 커스텀 3D 펫의 드래그 물리, 마우스 오버 시 클릭 통과 해제 및 복구 로직.
  * [app/components/Character3D.tsx](file:///c:/antigravity/pet-link/dedenne-web/app/components/Character3D.tsx): React Three Fiber(WebGL)를 사용한 귀여운 3D 아바타 모델 렌더링.
  * [public/releases/custom-pet-player.zip](file:///c:/antigravity/pet-link/dedenne-web/public/releases/custom-pet-player.zip): 사용자가 내 캐릭터 장바구니에서 최종 다운로드받을 전체 배포 패키지 템플릿.

---

## ⚠️ 치명적 트러블슈팅 이력 (다시 깨뜨리지 말 것!)

### 🚨 일렉트론 전체화면 백화(White Screen) 및 시스템 먹통 버그
* **증상**: 웹에서 캐릭터 다운로드 후 플레이어를 실행하면 화면 전체가 순식간에 하얗게 뒤덮여 아무것도 클릭할 수 없으며, 컴퓨터가 마비되고 UAC/관리자 승인 창조차 가려져 먹통이 됨.
* **원인**:
  1. `main.js`의 `app.disableHardwareAcceleration()`으로 인해 GPU 하드웨어 가속이 꺼져 WebGL(Three.js)이 강제 충돌 및 크래시되어 에러 창이 뜸.
  2. Next.js의 [globals.css](file:///c:/antigravity/pet-link/dedenne-web/app/globals.css) 기본 설정으로 인해 `body`의 배경이 하얀색(`#ffffff`)으로 칠해져 투명해야 할 일렉트론 전체화면 창이 불투명한 하얀 판이 됨.
  3. `alwaysOnTop: true`와 `maximize()`가 만나 거대한 하얀 장벽이 되어 온 바탕화면의 클릭을 가로막음.
* **해결 방안 및 유지보수 규칙**:
  * **절대** `app.disableHardwareAcceleration()`을 다시 켜지 마십시오. WebGL 렌더링을 위해 GPU 가속은 필수입니다.
  * 데스크톱 펫 화면(`/desktop`) 구동 시 반드시 `html`과 `body` 태그에 `.desktop-mode` 스타일이 켜지며 배경색이 무조건 완전히 투명(`background: transparent !important;`)하게 강제되는지 확인하십시오.
  * 웹 프로젝트의 빌드를 완료한 후에는 사용자들이 즉시 수정 버전으로 내려받을 수 있도록 **[custom-pet-player.zip](file:///c:/antigravity/pet-link/dedenne-web/public/releases/custom-pet-player.zip)** 파일 내부에도 수정한 파일들과 빌드 산출물(`out/` 폴더 전체)을 압축 적용하여 동기화해 주어야 합니다.

---

## 💾 유저가 직접 실행해야 할 대기 중인 Supabase SQL (Pending SQL Tasks)

> 아래 쿼리들은 AI가 권한이 없어 직접 실행할 수 없으므로, **유저가 Supabase SQL Editor에서 수동으로 실행**해야 합니다.

- **[2026-05-23 추가됨] `orders` 테이블 실시간 동기화 켜기**
  웹 상점의 구매 내역 및 충전 내역이 화면 새로고침 없이 즉시(Realtime) 업데이트되려면 `orders` 테이블에 실시간 퍼블리케이션을 켜주어야 합니다.
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  ```

- **[2026-06-11 추가됨] `orders` 및 `order_items` 테이블 Row Level Security (RLS) 비활성화**
  어드민 대시보드 및 통계 페이지에서 전체 회원들의 주문 내역과 매출 데이터를 정상적으로 가져오기 위해 RLS를 해제해야 합니다.
  ```sql
  ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
  ```

---

## 📋 향후 최우선 구현 과제 (Next Actions)

미래의 에이전트는 사용자와 논의하여 다음 중 하나를 골라 구현을 이어가 주십시오.

1. **🛍️ 캐릭터 쇼케이스 3D 상세 모달**: 상점 메인에서 캐릭터 선택 시 화면 중앙에 다이내믹하게 3D 캐릭터 렌더링과 상세 스펙을 띄우는 프리미엄 UI 기능.
2. **📊 크리에이터 정산 대시보드 페이지**: 일반 사용자가 직접 꾸민 펫을 등록하고 판매 데이터와 가상의 수익 정산 그래프를 볼 수 있는 플랫폼 컨셉 페이지 개발.
3. **⚙️ 데스크톱 플레이어 실시간 컨트롤 패널**: 데스크톱 캐릭터 우클릭 시 호출되는 설정 모달을 제작해 볼륨 조절, 크기(Scale) 확대/축소, 펫 움직임 빈도 설정(Autonomous activity level)을 실시간 반영하는 기능.

---

## 📝 실시간 작업 로그 (Progress Log)

이 프로젝트에서 작업한 모든 AI 모델들은 본인의 기여 내역을 아래 테이블 양식에 맞춰 반드시 추가해 주시기 바랍니다.

| 작업 일시 | 참여 AI 에이전트 | 상세 수행 내용 | 비고 / 주의사항 |
| :--- | :--- | :--- | :--- |
| 2026-05-18 | **Antigravity** (Gemini 3.1 Pro) | 1. `Character3D.tsx`에서 `hairStyleIndex`를 `frontHairIndex`와 `backHairIndex`로 분리하여 앞머리와 뒷머리 커스터마이징을 독립적으로 수행할 수 있도록 개선.<br>2. 깻잎머리, 5:5 가르마, 더듬이 등 새로운 앞머리 3D 에셋 추가.<br>3. `customize/page.tsx` UI를 업데이트하여 두 가지 헤어스타일을 따로 고를 수 있도록 인터페이스 개편. | 과거 저장된 `hairStyle` 값과의 호환성을 위해 `CustomPet.tsx`에 fallback 처리 로직 추가. |
| 2026-05-23 | **Antigravity** (Gemini 3.1 Pro) | 1. 파이썬 앱의 Supabase 연동 코드를 모두 제거하고 로컬 `pet_data.json` 파일 저장 방식으로 전면 개편하여 영구 저장 안정성 확보.<br>2. 인벤토리에서 '하트' 아이템 제거 및 데덴네 마우스 쓰담쓰담(`pat-pat`) 이벤트 시 하루 1회 호감도 +5 상승 로직 추가. | 로컬 파일 저장 방식이므로 웹 상점과의 아이템 구매 연동(웹 -> 앱)은 직접 구현할 수 없음. 이 부분은 추후 구조 재검토 필요. |
| 2026-05-23 | **Antigravity** (Gemini 3.1 Pro) | 1. Next.js `CheeseContext.tsx` 잔액 로드 시 PGRST116 에러(데이터 없음)를 `maybeSingle()`과 예외 처리(insert 기본값)로 해결.<br>2. `app/charge/page.tsx`에 나의 치즈 충전 내역 리스트 추가 (결제 금액 원화 기준). 토스페이먼츠 성공 시 `orders` 테이블 인서트 로직 보강.<br>3. `app/components/ItemShop.tsx`에 최근 아이템 구매 내역 리스트 추가 (치즈 소모 기준).<br>4. 두 내역 모두 실시간으로 갱신(Realtime Postgres Changes)되도록 상태 연동 완료. | 결제 내역과 상점 구매 내역은 `orders` 테이블의 `total_price` 크기(1000 이상은 충전, 미만은 구매)로 구분하도록 구현. |
| 2026-05-23 | **Antigravity** (Gemini 3.1 Pro) | 1. `ItemShop.tsx`에 추가했던 최근 구매 내역 UI 삭제 후, 장바구니(`cart/page.tsx`) 헤더에 `/orders` 링크 버튼 추가.<br>2. 상점 아이템에 장바구니를 거치지 않고 바로 구매할 수 있는 '바로 결제' 버튼 추가 (단건 즉시 구매 로직).<br>3. 장바구니 화면에서 상품 개수를 변경할 수 있는 `+/-` 수량 조절 기능 추가. | 장바구니 수량은 프론트엔드 로컬 상태(`quantities`)로 관리되며, 결제 시 해당 수량만큼 DB에 적용됨. 추가적인 DB 스키마 변경 불필요. |
| 2026-05-23 | **Antigravity** (Gemini 3.1 Pro) | 1. 결제 성공 페이지(`payment/success/page.tsx`)에서 Next.js Strict Mode로 인해 `useEffect`가 두 번 실행되어 토스페이먼츠 API 중복 호출("이미 처리중인 요청입니다.") 에러가 발생하는 문제 해결. | `useRef`를 도입하여 API 중복 호출을 완벽 차단함. |
| 2026-05-23 | **Antigravity** (Gemini 3.1 Pro) | 1. 상점에서 아이템 '담기' 시 띄워지는 토스트 알림에 `장바구니 가기` 바로가기 버튼 추가.<br>2. 장바구니 리스트에서 식빵, 수건 등 소모성 아이템이 3D 캐릭터로 렌더링되던 버그를 수정하여 이모지(Emoji)가 정상 출력되도록 수정.<br>3. 소모성 아이템에는 불필요한 'PC 플레이어 다운로드' 버튼 숨김 처리. | 카탈로그 아이템 분류 로직을 세분화하여 소모성 아이템과 펫을 명확히 구분하여 렌더링함. |
| 2026-05-23 | **Antigravity** (Gemini 3.1 Pro) | 1. 파이썬 앱에 Supabase 연동을 복구하지 않고 로컬 `pet_data.json` 파일을 유지하면서 웹 상점 구매 내역을 실시간으로 동기화하는 로컬 우회 API(`api/inventory/sync`) 신규 작성.<br>2. 파이썬 `main.py`에 `QFileSystemWatcher`를 추가하여, Next.js 서버가 백그라운드에서 `pet_data.json`을 수정하면 즉시 감지하여 펫 앱 가방 UI를 실시간으로 새로고침하도록 구현. | 두 앱이 모두 로컬 PC에서 실행 중이라는 점을 활용한 기발한 해결책 적용 완료. |
| 2026-05-23 | **Antigravity** (Gemini 3.1 Pro) | 1. Electron 커스텀 펫 플레이어(`custom-pet-player.zip`)에 데덴네와 동일한 인터랙션 기능 추가. 구체적으로는: ① `main.js`에 우클릭 네이티브 컨텍스트 메뉴(가방 열기/닫기, 종료) 및 `pet_data.json` 읽기/쓰기 IPC 핸들러 추가. ② `preload.js`에 `loadPetData`, `savePetData`, `showContextMenu`, `onToggleBag` API 노출. ③ `InventoryWindow.tsx` 신규 작성(식빵/딸기/비누/수건 아이템 UI, 호감도 게이지, 레벨 표시, 파일 저장). ④ `CustomPet.tsx` 전면 업데이트(우클릭 → 메뉴, 클릭 → 쓰담쓰담 하루1회 호감도+5, 말풍선, 가방 창 토글). ⑤ 수정된 소스 기반으로 새 `custom-pet-player.zip` 재패키징 완료. | 3D 커스텀 캐릭터 플레이어가 이제 데덴네 베타와 동일한 가방·아이템·쓰담쓰담·호감도 기능을 지원함. `pet_data.json` 파일을 공유하므로 웹에서 구매한 아이템도 즉시 연동됨. |
| 2026-05-23 | **Antigravity** (Gemini 3.1 Pro) | 1. 장바구니에서 펫 다운로드 시 로컬스토리지 `petLink_myPets`에 커스텀 캐릭터 설정 데이터 자동 저장되도록 수정.<br>2. 메인 페이지 우상단 유저 프로필 아바타 클릭 시 열리는 팝오버 메뉴에 `🐾 나의 펫` 및 `📦 구매 내역` 링크 추가.<br>3. `app/my-pets/page.tsx` 신규 생성: 저장된 커스텀 펫들을 다시 확인하고 언제든지 `custom-pet-player.zip` 템플릿과 결합해 `.zip` 파일로 재다운로드할 수 있는 갤러리 기능 구현. | DB 연동 전까지 브라우저 로컬스토리지를 활용해 다운로드 펫 데이터를 보존 및 재다운로드할 수 있도록 사용자 편의성 극대화. |
| 2026-05-29 | **Antigravity** (Claude Sonnet 4.6) | **[헤어 저장 버그 수정]** Electron 커스텀 펫 플레이어에서 앱 재시작 시 헤어 스타일이 항상 초기화되는 버그 수정. **원인**: `custom-pet-player-extracted/app/components/Character3D.tsx`가 구 단일 파라미터 `hairStyleIndex`만 받고, `CustomPet.tsx`도 저장 데이터의 `config.hairStyle`(구 필드, 항상 undefined)을 참조하여 항상 기본값(1)으로 렌더링됨. **수정 내역**: ① `Character3D.tsx` 인터페이스에서 `hairStyleIndex` 제거 → `frontHairIndex` + `backHairIndex` 분리 파라미터로 교체 (메인 웹과 완전 동기화). ② `CustomPet.tsx`의 `characterProps`에서 `config.hairStyle` 참조 제거 → `config.frontHairIndex` / `config.backHairIndex` 직접 매핑. ③ `main.js`의 `getDefaultPetData()`에 `current_hair: "default"` 필드 추가. ④ 안경(`glassesType`), 백팩 조건부 렌더링, 색상 fallback(`??`) 등 누락 props도 함께 수정. | 커스터마이즈 페이지(`customize/page.tsx`)는 이미 `localStorage`에 `frontHairIndex`/`backHairIndex`를 올바르게 저장하고 있었음. 문제는 저장이 아니라 플레이어가 로드할 때 잘못된 필드를 읽는 것이었음. **Supabase `user_stats` 테이블은 이 플레이어와 무관** — 이 플레이어는 로컬 `character.petlink` 파일과 `~/.petlink/pets/{id}_data.json`을 사용함. ZIP 재패키징 필요. |
| 2026-05-29 | **Antigravity** (Gemini 3.1 Pro) | **[PC 펫 플레이어 버그 패치 + ZIP 재패키징]** ① **터미널 미종료 버그**: `launch.vbs`가 삭제된 `npm run electron:dev` 스크립트를 호출해 CMD가 에러 상태로 계속 열려있던 문제 → `cmd /c run_pet.bat`을 숨김 창(0)으로 실행하도록 수정. ② **드롭 후 삐딱 걸음 버그**: `onDragEnd`에서 `velocity.current`에 `info.velocity.x * 0.01` 잔류 값이 X축 밀림을 유발 → 드롭 직후 `velocity.current = {x:0, y:0}`으로 완전 초기화 + `setState("idle")`로 상태 리셋. 수정 후 빌드(`npm run build`) 성공 및 `dedenne-web/public/releases/custom-pet-player.zip` 재패키징 완료. (참고: 헤어 렌더링 버그는 이미 my-pets 쪽 데이터를 불러오는 과정에서 수정되어 실제로는 문제가 없었으며, 불필요한 구체 위치 조정은 원상복구함) | **웹(`dedenne-web`) 코드는 일절 수정하지 않음.** 오직 `custom-pet-player-extracted` 폴더 내 `launch.vbs`, `app/components/CustomPet.tsx` 파일만 수정. |
| 2026-05-29 | **Antigravity** (Gemini 3.1 Pro) | **[PC 펫 플레이어 먹방 모션 추가]** ① `CustomPet.tsx`에 `activeItem` 상태를 추가하여 현재 어떤 아이템을 먹고 있는지 `Character3D.tsx`로 전달. ② `Character3D.tsx`에서 `eatingItem` props를 받아, `isEating` 상태일 때 오른손 쪽에 3D 렌더링된 아이템(식빵 `Box`, 딸기 `Cone+Sphere` 조합)이 생성되도록 구현. ③ 오른팔 회전 로직과 결합되어 자연스럽게 입으로 가져가는 먹방 모션 완성 및 ZIP 재배포. | 기존에 `state = "eat"`일 때 애니메이션은 있었으나 손에 아무것도 들려 있지 않던 점을 보완. |
| 2026-05-30 | **Antigravity** (Claude Sonnet 4.6) | **[먹방 사운드 수정]** 음식 아이템 사용 시 냠냠 소리가 나지 않던 버그 수정. **원인**: `CustomPet.tsx`의 `handleItemUse`에서 `new Audio('./yum.wav')`로 존재하지 않는 파일을 참조하고 있었음. 실제 오디오 파일(`[Track 04] Yum yum! Sound Effect.wav`)은 프로젝트 루트에만 있었고 `public/assets/dedenne/sounds/` 폴더에 없었음. **수정 내역**: ① `[Track 04] Yum yum! Sound Effect.wav`를 `custom-pet-player-extracted/public/assets/dedenne/sounds/eat_1.wav`로 복사. ② `CustomPet.tsx` 207줄의 오디오 경로를 `'./yum.wav'` → `'/assets/dedenne/sounds/eat_1.wav'`로 수정. ③ 빌드 후 ZIP 재패키징 완료. | 식빵(`bread`) 및 딸기(`strawberry`) 아이템 사용 시 `eat` 상태 진입 + 냠냠 사운드 동시 재생됨. 비누/수건은 사운드 없이 `wash` 상태만 유지 (기존 동작과 동일). |
| 2026-05-30 | **Antigravity** (Gemini 3.1 Pro) | **[PC 펫 플레이어 3D 목욕 및 드래그 최적화]** 파이썬 앱에 구현된 목욕(거품, 비눗방울) 효과와 마우스 "삐딱 걸음" 방지 로직을 Electron 3D 플레이어(`custom-pet-player-extracted`)에도 완전히 동일하게 구현함. **수정 내역**: ① `BubbleOverlay.tsx` 생성(Framer Motion 기반 비눗방울 파티클 추가). ② `CustomPet.tsx` 내에서 `wash` 상태 진입 시 5초간 BubbleOverlay 및 캐릭터 오버레이(방울)가 함께 나타나도록 수정 및 마우스 릴리즈 이벤트 버그 수정 적용. ③ `main.js`의 컨텍스트 메뉴에 `🛁 목욕 시키기` 항목을 추가하고 `start-cleaning` IPC 이벤트를 `preload.js`를 통해 전달하도록 연동. ④ `npm run build` 후 배포용 `custom-pet-player.zip` 재패키징. | 이제 3D 커스텀 플레이어에서도 우클릭 또는 가방 비누 사용으로 5초간의 동적인 목욕(비눗방울 파티클) 상호작용이 가능해짐. |
| 2026-05-30 | **Antigravity** (Gemini 3.1 Pro) | **[파이썬 2D 펫 신규 튜토리얼 시스템 추가]** 최초 실행 시 가방(인벤토리) 여는 방법을 알려주는 인터랙티브 튜토리얼 기능 추가. **수정 내역**: ① `pet_data.json`에 `tutorial_complete` 플래그 연동 (`main.py`). ② `pet_window.py`에 `start_tutorial`, `_animate_tutorial_cursor` 등 QTimer/QPainter 기반 가짜 마우스 커서 점멸 효과 구현. ③ 튜토리얼 중 캐릭터를 클릭(이동 없음)하면 가방이 자동으로 열리고, 2초 후 튜토리얼이 완료되도록 이벤트 바인딩. | 신규 유저가 좌클릭 상호작용을 쉽게 학습할 수 있게 됨. |
| 2026-05-30 | **Antigravity** (Gemini 3.1 Pro) | **[웹사이트 전용 인게임 튜토리얼 구현]** 데스크톱 앱 내부가 아닌, 메인 웹사이트(`dedenne-web`)상에서 돌아가는 전역 튜토리얼 기능 추가. **수정 내역**: ① `WebTutorial.tsx` 컴포넌트 신규 작성 후 `layout.tsx`에 마운트. ② 로그인 시 로컬 스토리지(`webTutorialComplete`)를 확인하여, 홈(`/`) 화면 우측 하단에 데덴네 이미지와 가짜 마우스 커서(Framer Motion) 오버레이 생성. ③ 발동 시 즉시 Supabase `user_inventory`에 비누 1개, 딸기 1개를 자동 Insert(보상 지급) 하도록 로직 구현. ④ `/my-pets` 페이지로 유도하여 가방 연동법을 안내하고 "튜토리얼 종료" 버튼을 눌러 상태를 완전 저장하도록 흐름 설계. | 웹 상에서 펫 가방 관리 UX의 직관성을 대폭 향상하고 초기 이탈률 방지. |
| 2026-05-30 | **Antigravity** (Gemini 3.1 Pro) | **[PC 펫 플레이어 3D 튜토리얼 시스템 이식]** 파이썬 2D 펫에 적용된 튜토리얼을 3D 플레이어(`custom-pet-player-extracted`)에도 동일하게 구현함. **수정 내역**: ① `main.js`의 `getDefaultPetData`에 `tutorial_complete: false` 추가. ② `CustomPet.tsx`의 `loadPetData` 시 플래그를 읽어와 튜토리얼 1단계 진입 시 CSS/Framer Motion 기반의 가짜 마우스 커서를 중앙에 점멸시킴. ③ 좌클릭 시 가방이 열리고 안내 문구 2초 출력 후 `electronAPI.savePetData`로 상태 저장 및 종료. ④ `npm run build` 후 `custom-pet-player.zip` 재패키징. | 파이썬과 3D 플레이어 모두 좌클릭 가방 오픈 튜토리얼을 1회 제공하여 초기 이탈률을 낮춤. |
| 2026-06-11 | **Antigravity** (Gemini 3.5 Flash) | **[어드민 통계 & 대시보드 개선 및 빌드 에러 수정]**<br>1. 어드민 대시보드(`app/admin/page.tsx`)에서 "전체 캐릭터 수" 카드를 복구하고 `user_inventory` 테이블을 통해 실시간 마리 수 집계 연동.<br>2. 어드민 유저 관리(`app/admin/users/page.tsx`)에서 `mainPet` undefined ReferenceError 버그를 `user_inventory` 조회 매핑으로 해결.<br>3. 유저 관리, 주문 내역, 주문 상세 모달의 통계금액 단위를 KRW(₩)로 통일하고 1,000원 이상의 결제 건만 수입으로 합산하도록 개선.<br>4. 정산 통계(`app/admin/stats/page.tsx`)의 인기 아이템 매출을 치즈 단위에서 원화(₩, 치즈 * 1000)로 표시 변환.<br>5. 어드민 시스템 로그(`app/admin/logs/page.tsx`)에서 존재하지 않는 `pets` 테이블 대신 `user_inventory`를 기준으로 통계 및 최근 가입 타임라인 집계하도록 변경.<br>6. TypeScript 빌드 에러들(ItemData Type의 `total_sales` 누락 및 CartContext 내 `id` 중복 할당 경고)을 해결하여 `npm run build` 빌드 패스 완료. | **Supabase DB 권한 필요**: client-side에서 전체 유저의 orders 및 order_items를 select할 수 있도록 Supabase SQL Editor에서 RLS를 비활성화하는 명령어를 실행해주어야 합니다. |
| 2026-06-16 | **Antigravity** (Gemini 3.1 Pro) | **[장바구니 3D 모델 렌더링 및 동물 캐릭터 다운로드 지원 패치]**<br>1. 장바구니(`cart/page.tsx`)와 내 펫(`my-pets/page.tsx`)에서 동물 캐릭터(닭, 말 등)가 소모품으로 잘못 분류되어 수량 조절 버튼만 나오고 다운로드 버튼이 안 나오던 버그 수정.<br>2. 커스텀 동물(고양이, 강아지)이 장바구니/내 펫 화면에서 사람 3D 모델로 렌더링되던 문제(`pet.type === 'animal'` 분기 누락) 수정.<br>3. `Universal3DViewer` 로직을 Electron 플레이어(`custom-pet-player-extracted`) 내부의 `CustomPet.tsx`에 이식하고 `npm run build` 및 `custom-pet-player.zip` 재패키징 완료. | **중요**: 다운로드 파일 생성 시 `custom-pet-player-extracted` 폴더를 기준으로 빌드해야 데스크톱에 반영됨. 이제 PC 앱에서도 닭, 말, 커스텀 강아지/고양이 등 모든 3D 캐릭터가 정상 표시됨. |
| *다음 AI* | *이름 입력* | *여기에 본인의 변경 사항을 작성해 주세요.* | *추가 코멘트* |
