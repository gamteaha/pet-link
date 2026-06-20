# Pet-Link 프로젝트 개발 프롬프트 

> 데이터과학과 202601664 김태희



### 프로젝트 개요

웹사이트에서 디지털 펫(3D 동물 또는 커스텀 캐릭터)을 입양하고,
치즈(게임 내 재화)로 아이템을 구매하면
PC 데스크탑 위에서 펫이 돌아다니는 **웹+데스크탑 연동 펫 시뮬레이션 서비스**

---

### 기술 스택 확인

```
웹 프레임워크:  Next.js (App Router, TypeScript)
UI:            React, Tailwind CSS
애니메이션:    Framer Motion
3D 렌더링:     Three.js + @react-three/fiber + @react-three/drei
DB/인증:       Supabase (PostgreSQL + Auth)
결제:          토스페이먼츠 SDK v2
데스크탑 앱:   Electron
배포:          Vercel
```

---

### Supabase 프로젝트 생성 및 스키마 구성

Supabase 대시보드에서 직접 실행:

```sql
-- 1. profiles 테이블 (가입 시 치즈 5개 지급)
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name  text,
  email         text,
  avatar_url    text,
  cheese_balance integer DEFAULT 5,
  created_at    timestamptz DEFAULT now()
);

-- 2. user_pets 테이블
CREATE TABLE user_pets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id),
  config     jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3. user_inventory 테이블
CREATE TABLE user_inventory (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id),
  item_id    text,
  quantity   integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- 4. items 테이블
CREATE TABLE items (
  id          text PRIMARY KEY,
  name        text,
  description text,
  price       integer,
  emoji       text,
  category    text,
  stock       integer DEFAULT -1,   -- ⚠️ 추가: 재고 (-1 = 무제한), 관리자 대시보드 재고 표기에 필요
  sales       integer DEFAULT 0,    -- ⚠️ 추가: 누적 판매량, 관리자 대시보드 판매량 컬럼에 필요
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- 5. orders 테이블
CREATE TABLE orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id),
  total_items     integer,
  total_price     integer,
  status          text DEFAULT 'completed',
  toss_payment_key text,            -- ⚠️ 추가: 토스페이먼츠 결제 키 (충전 결제 추적용)
  toss_order_id   text,             -- ⚠️ 추가: 토스페이먼츠 주문 ID
  ordered_at      timestamptz DEFAULT now()
);

-- 6. order_items 테이블
CREATE TABLE order_items (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  uuid REFERENCES orders(id),
  item_id   text,
  item_name text,
  price     integer,
  quantity  integer DEFAULT 1
);

-- 7. cheese_logs 테이블
CREATE TABLE cheese_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id),
  action        text,
  amount        integer,
  balance_after integer,
  reason        text,
  created_at    timestamptz DEFAULT now()
);

-- ⚠️ 추가: user_stats 테이블 (실제 프로젝트에 존재하나 원본 스키마에 누락)
-- 관리자 대시보드 통계 페이지(가입자 추이, 활동 지표 등)에서 사용
CREATE TABLE user_stats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id),
  total_spent     integer DEFAULT 0,
  total_orders    integer DEFAULT 0,
  last_active_at  timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- RLS 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON profiles USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_pets_self" ON user_pets USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_self" ON user_inventory USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_self" ON orders USING (auth.uid() = user_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_self" ON order_items
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

ALTER TABLE cheese_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cheese_logs_self" ON cheese_logs USING (auth.uid() = user_id);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_read_all" ON items FOR SELECT USING (true);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_stats_self" ON user_stats USING (auth.uid() = user_id);

-- ⚠️ 추가: orders ↔ profiles 외래 키
-- 관리자 매출 대시보드에서 Supabase의 PostgREST 중첩 select(JOIN) 기능을 쓰려면
-- (예: orders?select=*,profiles(display_name,email)) 반드시 FK 관계가 선언되어 있어야
-- PostgREST가 두 테이블의 관계를 인식한다. 이게 없으면 400 Bad Request가 발생한다.
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_profiles
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);
```

---

### items 테이블 초기 데이터 삽입

> ⚠️ 주의: 아래 `category` 값은 영문(`pet`/`food`/`apparel`)으로 통일한다.
> 실제 개발 과정에서 코드(`ItemModal.tsx` 드롭다운)와 DB 저장값(`'음식'`, `'소품'` 등 한글)이 서로 달라
> "수정 모달을 열면 카테고리가 항상 첫 번째 옵션(펫)으로 초기화되는 버그"가 발생한 적이 있다.
> **드롭다운 `<option value="">`와 DB 저장값은 반드시 1:1로 정확히 일치시킬 것.**

Supabase 대시보드 → Table Editor → items 에서 직접 실행:

```sql
INSERT INTO items (id, name, description, price, emoji, category, stock, sales) VALUES
  ('cat',       '고양이',   '귀여운 고양이 펫',      40,  '🐱', 'pet',     -1, 0),
  ('dog',       '강아지',   '활발한 강아지 펫',      30,  '🐶', 'pet',     -1, 0),
  ('raccoon',   '너구리',   '야행성 너구리 펫',      50,  '🦝', 'pet',     -1, 0),
  ('pig',       '돼지',     '복스러운 돼지 펫',      30,  '🐷', 'pet',     -1, 0),
  ('chick',     '병아리',   '노란 병아리 펫',        25,  '🐥', 'pet',     -1, 0),
  ('chicken',   '닭',       '씩씩한 닭 펫',          30,  '🐓', 'pet',     -1, 0),
  ('horse',     '말',       '늠름한 말 펫',          60,  '🐴', 'pet',     -1, 0),
  ('blue-tang', '파란돔',   '바닷속 물고기 펫',      35,  '🐟', 'pet',     -1, 0),
  ('bread',     '식빵',     '펫이 좋아하는 식빵',    10,  '🍞', 'food',    999, 0),
  ('strawberry','딸기',     '달콤한 딸기',            8,  '🍓', 'food',    999, 0),
  ('soap',      '비누',     '펫을 깨끗하게',         15,  '🧼', 'apparel', 999, 0),
  ('towel',     '수건',     '포근한 수건',           12,  '🪣', 'apparel', 999, 0);
```

---

### Supabase Project URL, Anon Key 복사

> NEXT_PUBLIC_SUPABASE_URL=your_SUPABASE_URL
> NEXT_PUBLIC_SUPABASE_ANON_KEY=your_SUPABASE_ANON_KEY
> SUPABASE_SERVICE_ROLE_KEY=your_SERVICE_ROLE_KEY

---

### 빈 폴더를 생성하고 pet-link로 이름 변경

---

### 터미널을 열고 코드베이스 구성

```
npx create-next-app@latest .
```

선택 옵션: TypeScript ✅ / App Router ✅ / Tailwind CSS ✅

---

### 추가 패키지 설치

```
npm install @supabase/supabase-js @supabase/ssr
npm install framer-motion
npm install three @react-three/fiber @react-three/drei
npm install @types/three --save-dev
npm install @tosspayments/tosspayments-sdk
npm install jszip
```

---

### 환경변수 파일 생성

.env.local 파일을 만들고 아래 키를 등록:

```
NEXT_PUBLIC_SUPABASE_URL=your_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=your_SERVICE_ROLE_KEY
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
```

---

### 3D 모델 에셋을 본따 3D 모델 제작 

public/models/ 폴더를 만들고 아래 GLB 파일을 복사:

```
public/models/cat.glb
public/models/dog.glb
public/models/raccoon.glb
public/models/pig.glb
public/models/chick.glb
public/models/chicken.glb
public/models/horse.glb
public/models/blue-tang.glb
```


를 참고하여 고양이 강아지 너구리 돼지 병아리 닭 말 불루탱을 사람 만든 것 처럼 3D로 제작해줘.
> ⚠️ 추가 설명: `cat.glb`(Quaternius CC0 무료 에셋) 실제 분석 결과
> - 파일 크기 231KB, 라이센스 CC0(완전 무료, 상업적 사용 가능, 출처 표기 불필요)
> - 포함된 애니메이션 클립 8개: `Idle`, `Idle_Eating`, `Walk`, `Run`, `Jump_Start`, `Jump_Loop`, `Headbutt`, `Death`
> - 뼈대 구조(Bone): `AnimalArmature > Root > All > Cat > [Body, Head, Tail, FrontLeg.L/R, BackLeg.L/R]`
> - `Head` 노드가 별도로 분리되어 있어 **시선 추적(고개를 마우스 방향으로 회전)** 구현이 가능함
> - 재질은 `Atlas` 단일 머티리얼이라 `MeshStandardMaterial.color` 값을 바꾸는 방식으로 **털 색상 커스터마이징**이 가능함
> - 다른 종(dog, raccoon 등)도 동일한 클립 네이밍 규칙을 따른다고 가정하고 매핑하되, 실제 파일을 받으면 동일한 방식으로 클립명을 재검증할 것

---

### Supabase 초기화 파일 제작

프롬프트:

```
1. 아래 두 파일을 만들어줘
   - utils/supabase/server.ts : 서버 컴포넌트용 supabase 클라이언트
   - utils/supabase/client.ts : 클라이언트 컴포넌트용 supabase 클라이언트

2. 아래 패키지가 이미 설치되어 있어
   @supabase/supabase-js
   @supabase/ssr

3. 환경변수에 아래 키가 등록되어 있어
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY

다른 화면이나 로직은 수정하지 말고, 초기화 코드만 작성해줘.
```

---

### 디자인 시스템 설정 (펫샵 테마 v1 — 기본 토큰)

프롬프트:

```
지금 디자인 md에 참고 디자인을 넣어놨어.
globals.css에 아래 CSS 변수를 추가해줘.
폰트는 Noto Sans KR을 Google Fonts에서 import해서 적용해줘.

:root {
  --color-pet-bg:     #d6e8f0;
  --color-pet-glass:  rgba(255,255,255,0.45);
  --color-pet-text:   #3d3d5c;
  --color-pet-point:  #e07a5f;
  --color-pet-sub:    #81b29a;
  --color-pet-accent: #f2cc8f;
}

카드 공통 스타일도 추가해줘:
.pet-case-card {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255,255,255,0.7);
  border-radius: 2rem;
  box-shadow: 0 4px 24px rgba(100,130,180,0.10);
  transition: all 0.25s ease;
}
.pet-case-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(100,130,180,0.18);
}

다른 파일은 수정하지 말고 globals.css만 수정해줘.
```

---

### ⚠️ (추가) 디자인 리뉴얼 — 펫샵 콘셉트 전면 적용

> 위 1차 디자인 토큰 설정 이후, 실제 펫샵 인테리어(유리 진열장 + 따뜻한 분위기)를 참고하여
> 전면 리뉴얼을 추가로 진행했다. 아래는 그 과정에서 실제로 요청한 프롬프트들이다.

#### 1) 전역 디자인 토큰 + 유리 진열장(Glassmorphism) 카드 효과

프롬프트:

```
전체 디자인을 모던 펫샵 컨셉으로 바꾸고 싶어.

디자인 토큰:
- 배경색: #FDFAF5 (따뜻한 아이보리)
- 카드 배경: rgba(255, 255, 255, 0.45)
- 포인트 컬러: #E8A87C (따뜻한 오렌지)
- 메인 텍스트: #3D2B1F (다크 브라운)
- 보조 텍스트: #8B6F5E

globals.css에 .glass-card 클래스를 만들고
배경에 은은한 도트 패턴(.pet-bg-pattern)도 추가해줘.

.glass-card {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  transition: all 0.25s ease;
}
.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

만든 .glass-card 클래스를 실제 아이템 카드, 캐릭터 카드, 장바구니,
상세 페이지 등 모든 주요 카드 컴포넌트의 className에 직접 적용해줘.
(globals.css에 정의만 하고 컴포넌트에 안 붙이는 실수가 없도록 컴포넌트 파일까지 직접 수정할 것)
```

#### 2) 캐릭터 카드 → "유리 진열 케이스" 스타일 (푸른 계열)

> 실제 펫샵 유리 진열장(동물이 케이스 안에 들어있는 느낌)을 참고해서
> 단순 글래스모피즘에서 한 단계 더 발전시킨 버전.

프롬프트:

```
캐릭터 상점의 카드들을 실제 펫샵 진열장처럼
푸른 계열 유리 케이스 안에 펫이 들어있는 느낌으로 바꿔줘.

색상:
- 카드 배경(유리 내부): rgba(200, 235, 255, 0.35)
- 유리 테두리: rgba(120, 200, 230, 0.6)
- 카드 상단 반사광: rgba(255,255,255,0.5) 그라디언트
- 케이스 하단 바닥재: rgba(210, 240, 220, 0.4)
- 전체 배경: #EAF6FB

.pet-case-card {
  background: linear-gradient(160deg, rgba(220, 245, 255, 0.6) 0%, rgba(180, 225, 245, 0.3) 100%);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(120, 200, 230, 0.7);
  border-radius: 16px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.6),
    inset 0 -2px 8px rgba(100,180,220,0.2),
    0 4px 20px rgba(80, 160, 200, 0.15);
  overflow: hidden;
  position: relative;
}
.pet-case-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 40%;
  background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}
.pet-case-floor {
  background: linear-gradient(180deg, rgba(180, 230, 200, 0.3) 0%, rgba(160, 210, 180, 0.5) 100%);
  height: 28px;
  border-top: 1px solid rgba(120, 200, 150, 0.3);
}
.pet-case-card:hover {
  border-color: rgba(80, 180, 220, 0.9);
  transform: translateY(-4px);
  transition: all 0.25s ease;
}

펫 이모지/이미지가 들어가는 영역은 별도로 .pet-display-area 클래스로 분리해서
radial-gradient 배경 + font-size 72px(이모지 크게) + 중앙 정렬로 만들어줘.

캐릭터 상점 카드, 아이템 상점 카드 둘 다 이 스타일로 통일 적용해줘.
```

#### 3) 입장 스플래시 화면 + 벨소리

> 단순 자동재생 벨소리는 브라우저 자동재생 정책(`NotAllowedError`)에 막히는 문제가 있어
> "클릭으로 진입하는 스플래시 화면" 방식으로 변경했다.

프롬프트:

```
사이트 진입 시 메인 화면으로 바로 들어가지 말고,
먼저 펫샵 입장 스플래시 화면(SplashScreen.tsx)이 뜨게 해줘.

레이아웃 (위→아래):
- 하늘색 배경(#C8E8F0) 전체
- 발자국 🐾 아이콘 (상단)
- 펫샵 건물 SVG 일러스트 (직접 그릴 것, 아래 구성요소 포함)
  - 아이보리/크림색 건물 본체 (#FEFAE0)
  - 민트/청록색 줄무늬 차양 (#7ECECA)
  - 뼈다귀 모양 간판에 "Pet-Link Shop" 텍스트
  - 청록색 유리문/창문
  - 쇼윈도우에 발자국 무늬
- Pet-Link Shop 타이틀
- 서브 텍스트
- "입장하기" 버튼

버튼 클릭 시:
1. 벨소리(/sounds/shop-bell.mp3, 볼륨 0.4) 재생
   → 클릭 이벤트 안에서 재생해야 브라우저 자동재생 정책을 우회할 수 있음
2. 벨소리 재생 직후 또는 0.5초 후 메인 화면으로 페이드 전환

애니메이션(framer-motion):
- 건물 일러스트: 아래서 위로 (y: 30 → 0, opacity: 0 → 1, duration 0.6)
- 타이틀: 건물 애니메이션 후 0.3초 딜레이 페이드인
- 버튼: 마지막 등장 + 살짝 통통 튀는 효과(scale: 0.95 → 1)
```

> 벨소리 mp3 파일은 Pixabay 등 무료 사이트에서 "shop bell" 검색 후 다운로드하여
> `/public/sounds/shop-bell.mp3` 경로에 직접 배치한다.

#### 4) 페이지 전환 애니메이션

프롬프트:

```
framer-motion의 AnimatePresence를 사용해서 페이지 이동 시마다
부드러운 전환(Fade & Slide) 애니메이션이 발생하도록 app/template.tsx를 만들어줘.

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -20 },
};
transition: { duration: 0.3, ease: 'easeInOut' }
```

#### 5) 메인 페이지 타이틀 위 펫샵 건물 일러스트 + 떠다니는 장식

> 스플래시 화면에서 쓴 펫샵 건물 SVG를 메인 페이지 상단에도 동일하게 재사용하고,
> 페이지 전체에 "여기는 펫샵이다"라는 인상을 주는 배경 장식을 추가했다.

프롬프트:

```
1. 메인 페이지 "Pet-Link Shop" 타이틀 바로 위에
   SplashScreen에서 만든 펫샵 건물 SVG를 동일하게 삽입해줘.
   크기는 200x180 정도로 타이틀보다 살짝 작게,
   진입 시 아래에서 위로 올라오는 애니메이션(y: 30→0, opacity: 0→1) 적용.

2. 페이지 배경에 떠다니는 펫샵 소품 애니메이션을 추가해줘.
   FloatingDecorations.tsx 컴포넌트로 분리.

   소품 목록:
   - 🎣 고양이 낚싯대: 좌우로 살랑살랑 (rotate -10~10)
   - 🦴 뼈다귀: 위아래로 둥실 (y 0~-12)
   - 🐾 발자국: 페이드인/아웃 반복
   - 🐟 물고기: 좌우로 헤엄
   - 🩷 하트: 위아래 통통
   - ✨ 별 3개: 반짝반짝(각각 다른 delay)

   공통 스타일: position: absolute, pointer-events: none, opacity 0.5,
   각 소품마다 animate에 repeat: Infinity 적용하고 delay를 다르게 줘서
   한꺼번에 움직이지 않도록 해줘.

3. 캐릭터 카드들이 페이지 로드 시 순서대로 올라오게(index * 0.15초 딜레이)
   진입 애니메이션을 추가해줘.
```

#### 6) 배경 장식 위치/동작 수정 (1차 피드백 반영)

> 1차 결과물에서 두 가지 문제가 발견되어 수정 요청.
> ① 소품이 `position: fixed`라 스크롤 시 화면을 따라다님
> ② 소품이 너무 작아 눈에 띄지 않음

프롬프트:

```
기존 FloatingDecorations의 소품들 position을 fixed → absolute로 바꿔서
스크롤해도 따라다니지 않고 배경에 고정되게 해줘.

그리고 화면 양쪽 사이드에 더 크고 뚜렷한 소품을 추가해줘(font-size 80px):
- 왼쪽 상단: 🎣 (좌우로 흔들, transformOrigin: top center)
- 오른쪽 상단: 🪄 (반대 방향으로 흔들)
- 왼쪽 하단: 🦴 (위아래로 둥실)
- 오른쪽 하단: 🐾 (회전 + 스케일)

각 소품 delay를 다르게 줘서 자연스럽게 보이도록 해줘.
```

#### 7) 배경 장식 2차 수정 — 크기/위치/호버 인터랙션

> 2차 피드백: 사이드 장식이 여전히 작고, 스크롤에 안 따라오는 건 좋은데 위치가 부적절하며,
> 처음부터 계속 움직이는 것보다 마우스를 올렸을 때만 반응하는 게 자연스럽겠다는 의견 반영.

프롬프트:

```
사이드 장식 3가지를 수정해줘.

1. 크기: 100~120px로 더 크게
2. 위치: 화면 상단/중단이 아니라 좌우 "하단" (bottom 기준 100~320px 범위)
3. 애니메이션: 처음엔 정지 상태로 있다가, 마우스를 올렸을 때만(whileHover) 흔들리도록 변경
   - 기존 animate + transition repeat:Infinity 코드는 전부 제거
   - whileHover만 사용
   - pointerEvents를 'none' → 'auto'로 변경 (hover 감지를 위해 필수)

배치:
- 왼쪽 하단: 🎣 (whileHover: rotate [0,-15,15,-15,0])
- 오른쪽 하단: 🪄 (whileHover: rotate [0,15,-15,15,0])
- 왼쪽 중하단: 🦴 (whileHover: y [0,-20,0], scale [1,1.15,1])
- 오른쪽 중하단: 🐾 (whileHover: scale [1,1.2,1], rotate [0,-10,10,0])
```

#### 8) 우상단 네비바 아이콘 크기 조정

프롬프트:

```
우상단 네비바의 "치즈 충전" 버튼, 장바구니 아이콘, 프로필 아이콘이 너무 작아.
전체적으로 1.3~1.5배 키워줘.
- 치즈 충전 버튼: padding과 font-size 키우기
- 장바구니 아이콘: width/height 키우기
- 프로필 아이콘: width/height 키우기
```

---

### 구글 로그인 설정

1. Supabase 대시보드 → Authentication → Sign In / Providers → Google 클릭
2. Google Cloud Console에서 새 프로젝트 'pet-link' 생성
3. API 및 서비스 → 사용자 인증 정보 → OAuth 클라이언트 ID 생성
   - 클라이언트 ID: your-google-client-id
   - 클라이언트 비밀번호: your-google-client-secret
4. Supabase Google Provider에 클라이언트 ID, 비밀번호 입력

---

### AuthContext 구현

프롬프트:

```
context/AuthContext.tsx를 만들어줘.

관리할 상태:
- user: Supabase User 객체 (null이면 미로그인)
- profile: profiles 테이블 데이터 (display_name, email, avatar_url, cheese_balance)
- loading: 로딩 상태
- signInWithGoogle(): Google OAuth 로그인
- signOut(): 로그아웃
- refreshProfile(): profiles 테이블 재조회

구현 조건:
- Supabase onAuthStateChange로 로그인 상태를 추적해
- 로그인 감지 시 profiles 테이블에서 해당 사용자 row를 조회해
- profiles 테이블에 row가 없으면(첫 로그인) cheese_balance=5로 자동 INSERT해
- app/layout.tsx에서 AuthProvider로 전체를 감싸줘
```

---

### CheeseContext 구현

프롬프트:

```
context/CheeseContext.tsx를 만들어줘.

관리할 상태:
- cheeseBalance: 현재 치즈 잔액
- loading: 로딩 상태
- refreshCheese(): DB 재조회
- addCheese(amount, reason): 치즈 적립
- spendCheese(amount, reason): 치즈 차감, 성공하면 true 실패하면 false 반환

중요:
- addCheese, spendCheese에서 절대로 React state 값을 직접 사용하지 말고
  항상 DB에서 최신값을 SELECT한 다음 연산해
  (동시 요청으로 잔액이 꼬이는 걸 막기 위해서야)
- 치즈 변동 때마다 cheese_logs 테이블에 INSERT해
  (action: 'earn' 또는 'spend', balance_after, reason)
- app/layout.tsx의 AuthProvider 안에 CheeseProvider도 추가해줘
```

### ⚠️ (추가) Provider 중첩 순서 — 치즈 잔액 증발 버그 방지 (중요)

> AuthContext, CheeseContext, CartContext를 app/layout.tsx에 개별적으로
> 추가하는 과정에서 Provider 중첩 순서가 어긋나 CheeseProvider가
> AuthProvider보다 바깥쪽(혹은 형제 레벨)에 위치하게 된 적이 있었다.
> 이 경우 CheeseProvider가 useAuth()로 user 정보를 가져오는 시점에
> 아직 인증 상태가 확정되지 않아 잘못된(또는 빈) user 기준으로 잔액을
> 조회하면서, 결제 시 "치즈 32개를 구매했는데 기존 잔액이 사라지고
> 32개로 덮어써지는" 버그가 발생했다. 이는 React Context의 중첩 순서
> 문제이므로 명시적으로 고정해야 한다.

프롬프트:

```
app/layout.tsx의 Provider 중첩 순서를 아래와 같이 반드시 고정해줘.
순서가 어긋나면 CheeseContext가 아직 확정되지 않은 인증 상태를
기준으로 동작해서 치즈 잔액이 덮어써지는 심각한 버그로 이어진다.

올바른 중첩 순서 (바깥 → 안쪽):
<AuthProvider>
  <CheeseProvider>
    <CartProvider>
      {children}
    </CartProvider>
  </CheeseProvider>
</AuthProvider>

이유:
1. CheeseProvider는 내부적으로 useAuth()를 호출해 현재 로그인한
   user.id를 기준으로 cheese_balance를 조회/갱신한다. 따라서
   AuthProvider보다 반드시 안쪽(자식)에 있어야 user 값이 확정된
   이후에 치즈 조회 로직이 실행된다.
2. CartProvider는 결제 시 CheeseContext의 spendCheese()를 호출하므로
   CheeseProvider보다 안쪽에 있어야 한다.
3. CheeseProvider 내부에서 user가 바뀔 때(로그인/로그아웃)
   refreshCheese()를 다시 실행하도록 useEffect 의존성 배열에
   user?.id를 반드시 포함시켜줘. 이게 빠지면 로그인 직후
   잔액이 갱신되지 않거나, 이전 세션의 잔액이 잠깐 남아있다가
   덮어써지는 레이스 컨디션이 발생할 수 있다.

이 순서는 이후 다른 Provider(예: NotificationProvider 등)를
추가하더라도 반드시 유지되어야 하며, 새 Provider를 추가할 때마다
"이 Provider가 어떤 Context를 참조하는가"를 먼저 확인하고
참조하는 Context의 안쪽에 배치해야 한다.
```

---

### CartContext 구현

프롬프트:

```
context/CartContext.tsx를 만들어줘.

관리할 상태:
- items: 장바구니에 담긴 아이템 목록
  각 아이템: { id, name, price, emoji, quantity, category, config? }
- addItem(item): 아이템 추가 (이미 있으면 수량 증가)
- removeItem(id): 아이템 제거
- updateQuantity(id, quantity): 수량 변경
- clearCart(): 전체 비우기
- totalCheese: 총 치즈 합계

저장소: localStorage key = 'petLink_cart'
주의: localStorage는 typeof window !== 'undefined' 체크 후 접근해
app/layout.tsx의 CheeseProvider 안에 CartProvider도 추가해줘.
```

---

### 메인 상점 페이지 구성

프롬프트:

```
app/page.tsx를 메인 상점 페이지로 만들어줘.

레이아웃:
- 상단 헤더: 로고(왼쪽), 로그인 버튼 또는 프로필 아바타(오른쪽), 치즈 잔액 표시
- 메인 영역: 두 섹션으로 구성
  1. 커스텀 캐릭터 배너 (직접 만드는 나만의 캐릭터)
  2. 동물 펫 카드 목록

동물 펫 카드 구성 (items 테이블에서 category='pet'인 것만):
- 이모지, 이름, 가격(치즈 N개)
- '자세히 보기' 버튼 → /shop/[id] 페이지로 이동
- '장바구니 담기' 버튼

식품/소품 섹션:
- items 테이블에서 category='food', 'apparel' 항목을 카드로 나열

디자인: var(--color-pet-bg) 배경, pet-case-card 카드 스타일 사용
```

> ⚠️ 추가: 이후 디자인 리뉴얼 프롬프트(상단 "디자인 리뉴얼 — 펫샵 콘셉트 전면 적용" 섹션)가
> 적용되면서 `pet-case-card`는 `.glass-card` + 푸른 유리 진열 케이스 스타일로 교체되었다.

---

### 로그인 페이지 구성

프롬프트:

```
app/login/page.tsx를 만들어줘.
AuthContext의 signInWithGoogle()을 연결해서 구글 로그인 버튼을 만들어줘.
로그인 성공 시 메인 페이지(/)로 이동해.
메인 페이지 디자인 컨셉을 유지해.
로그인한 상태로 /login에 접근하면 /로 redirect해.
```

---

### Universal3DViewer 컴포넌트 구현

프롬프트:

```
app/components/characters/Universal3DViewer.tsx를 만들어줘.

props:
- species: 'cat' | 'dog' | 'raccoon' | 'pig' | 'chick' | 'chicken' | 'horse' | 'blue-tang'
- animation: 'idle' | 'walk' | 'eat' | 'click' | 'jump' (기본값: 'idle')
- direction: 1 | -1 (이동 방향, 기본값: 1)
- furColor: string (털 색상 hex, 기본값: '#A89BC0')
- characterSize: number (기본값: 100)
- autoRotate: boolean (기본값: false)
- trackMouse: boolean (마우스 시선 추적, 기본값: false)

GLB 경로 매핑:
cat → /models/cat.glb
dog → /models/dog.glb
raccoon → /models/raccoon.glb
pig → /models/pig.glb
chick → /models/chick.glb
chicken → /models/chicken.glb
horse → /models/horse.glb
blue-tang → /models/blue-tang.glb

논리 애니메이션 → GLB 실제 클립명 매핑:
[표준 4족: cat, dog, raccoon, pig, horse]
  idle → 'Idle'
  walk → 'Walk'
  eat  → 'Idle_Eating'
  click → 'Headbutt'
  jump → 'Jump_Start'

[조류: chick, chicken]
  idle → 'Idle'
  walk → 'Run'
  eat  → 'Idle_Peck'
  click → 'Attack'
  jump → 'Run'

[어류: blue-tang]
  idle → 'Fish_Armature|Fish_Armature|Swimming_Normal'
  walk → 'Fish_Armature|Fish_Armature|Swimming_Fast'
  eat  → 'Fish_Armature|Fish_Armature|Swimming_Normal'
  click → 'Fish_Armature|Fish_Armature|Attack'
  jump → 'Fish_Armature|Fish_Armature|Swimming_Impulse'

구현 조건:
- 멀티 인스턴스 골격 충돌 방지를 위해 SkeletonUtils.clone(scene)으로 복제해서 사용해
- 애니메이션 전환 시 crossFadeTo(action, 0.3, true)로 부드럽게 전환해
- direction prop으로 모델 rotation.y를 설정해 이동 방향을 바라보게 해
  (direction=1이면 Math.PI, direction=-1이면 0, lerp 0.1로 부드럽게)
- Head 노드가 있는 species만 trackMouse 시선 추적 적용해
  (Head 없는 species: chick, chicken, blue-tang)
- furColor는 scene.traverse로 MeshStandardMaterial.color에 적용해
- useGLTF.preload()로 모든 모델 미리 로드해
- 'use client' 지시어 필수 (Three.js는 서버사이드 렌더링 불가)
- Next.js에서 이 컴포넌트를 import할 때는 ssr: false 옵션의 dynamic import를 사용할 것
  (예: const Universal3DViewer = dynamic(() => import('...'), { ssr: false }))
```

> ⚠️ 추가 설명 (cat.glb 실측 기준): 실제 받은 `cat.glb` 분석 결과 애니메이션 클립명은
> `Idle`, `Idle_Eating`, `Walk`, `Run`, `Jump_Start`, `Jump_Loop`, `Headbutt`, `Death` 8개였다.
> 위 매핑표의 `jump → 'Jump_Start'`는 점프 시작 동작만 재생하므로,
> 자연스러운 점프를 위해서는 `Jump_Start` 종료 후 `Jump_Loop`로 자동 전환하고
> 착지 시점에 다시 `Idle`로 복귀하는 애니메이션 체이닝 로직을 추가로 구현해야 한다.

---

### Animal3DCharacter 래퍼 컴포넌트 구현

프롬프트:

```
app/components/characters/Animal3DCharacter.tsx를 만들어줘.
Universal3DViewer를 감싸는 래퍼야.

props:
- species: string
- furColor: string (기본값: '#A89BC0')
- isEating: boolean (기본값: false)
- isMoving: boolean (기본값: false)
- direction: 1 | -1 (기본값: 1)
- trackMouse: boolean (기본값: true)
- characterSize: number (기본값: 100)

동작:
- isEating=true이면 animation='eat'
- isMoving=true이면 animation='walk'
- 둘 다 false이면 animation='idle'
- 클릭 시 animation='click'으로 1초간 전환 후 idle 복귀
  (isEating이나 isMoving 상태이면 클릭 무시)
```

---

### ⚠️ (추가) 캐릭터 상호작용 고도화 — 우클릭 인벤토리 / 드래그 먹이주기 / 시선 추적

> 데스크탑 펫이 단순히 화면 위에 떠 있기만 하는 게 아니라,
> 실제로 사용자와 상호작용하도록 추가 기능을 요청했다. (3D 고양이 모델 도입은 별도 진행, 아래쪽 참고)

#### 1) 우클릭 → 인벤토리 가방 레이어

프롬프트:

```
app/components/InventoryPopup.tsx를 만들어줘.

동작:
- 캐릭터 위에서 우클릭 시 브라우저 기본 컨텍스트 메뉴를 막고(e.preventDefault())
  캐릭터 바로 옆에 인벤토리 가방 팝업을 띄워줘.
- 팝업 위치: position fixed, 우클릭한 마우스 좌표(e.clientX, e.clientY) 기준
  단, 화면 밖으로 나가지 않도록 좌표를 보정해줘.
- Supabase user_inventory 테이블에서 보유 수량이 1 이상인 아이템만 불러와서
  이모지 + 이름 + 수량(xN) 형태로 리스트업해줘.
- 팝업 바깥을 클릭하면 닫히도록 useEffect + mousedown 이벤트로 처리해줘.
- 하단에 "간식을 마우스로 끌어 캐릭터에게 먹여보세요!" 안내 문구를 넣어줘.
```

#### 2) 드래그 앤 드롭 먹이주기

프롬프트:

```
app/components/DraggableItem.tsx를 만들어줘.
InventoryPopup 안의 각 아이템에 HTML5 Drag and Drop API를 적용해서
드래그 시작 시 dataTransfer에 itemId를 담아 전송하도록 해줘.

캐릭터 컴포넌트 쪽에는 onDrop, onDragOver 핸들러를 추가해서:
1. 드롭된 아이템 ID를 읽고
2. 캐릭터의 '먹는' 애니메이션(eatVariants)을 재생하고
   - scale: [1, 1.2, 0.9, 1.15, 1], rotate: [0, -5, 5, -3, 0], duration 0.5
   - 음식 이모지가 캐릭터 머리 위에서 아래로 내려오다 사라지는 효과
   - 먹는 순간 ✨ 파티클을 잠깐 표시
3. Supabase user_inventory에서 해당 아이템 수량을 1 감소시키고
4. 인벤토리 팝업이 열려있다면 화면도 즉시 갱신해줘.

효과음(/public/sounds/eat.mp3)이 있으면 재생하고,
파일이 없어도 에러 없이 시각 효과만 동작하도록 try-catch로 감싸줘.
```

#### 3) 시선 추적 (마우스 바라보기)

프롬프트:

```
app/components/characters/CharacterWithEyes.tsx를 만들어줘.

- window의 mousemove 이벤트로 마우스 좌표를 추적해.
- 캐릭터 컨테이너의 중심 좌표를 getBoundingClientRect()로 구하고,
  마우스와 캐릭터 중심 사이의 각도(Math.atan2)를 계산해.
- 2D 이미지/이모지 캐릭터는 눈동자를 직접 제어할 수 없으므로,
  캐릭터 컨테이너 전체를 마우스 방향 기준 -15~15도 범위로 살짝 회전(rotate)시켜서
  "고개를 돌려 바라보는" 느낌을 줘.
- transition: transform 0.15s ease-out 으로 부드럽게 따라오게 해줘.

(참고: 사람 캐릭터/2D 캐릭터에는 이 컨테이너 회전 방식을 적용하고,
 cat.glb 같은 3D 모델은 실제 Head 본(bone)을 직접 회전시키는 방식을 별도로 사용한다.
 → Universal3DViewer의 trackMouse 옵션 참고)
```

#### 4) 캐릭터 크기 조절 시 발생한 버그 수정 2건

> 커스터마이즈 화면에서 캐릭터 크기(`characterSize`)를 슬라이더로 키울 때
> 실제로 두 가지 시각적 버그가 발생하여 수정했다.

프롬프트 (버그 1 — 머리 잘림):

```
캐릭터 크기를 키우면 머리가 위쪽으로 잘려.
미리보기 컨테이너에 overflow: visible을 적용하거나
컨테이너 크기를 SVG/3D 캔버스 크기에 맞게 동적으로 늘어나게 해줘.
SVG의 경우 viewBox는 고정하고 width/height만 비율에 맞게 바꾸는 방식으로
스케일을 조절해서 잘림 없이 커지도록 해줘.
```

프롬프트 (버그 2 — 이름표 비율 불일치):

```
캐릭터 크기를 키워도 이름표(말풍선)는 크기가 그대로라 따로 놀아.
이름표도 캐릭터 size prop을 함께 받아서
fontSize, padding, border-radius가 캐릭터 크기에 비례해서 같이 커지도록 해줘.
```

---

### 상점 상세 페이지 구성

프롬프트:

```
app/shop/[id]/page.tsx를 만들어줘.
URL의 id는 items 테이블의 id야 (예: 'cat', 'raccoon').

레이아웃:
- 왼쪽: Universal3DViewer로 3D 모델 표시 (autoRotate=true)
- 오른쪽: 아이템 정보 (이름, 가격, 설명)

동물 펫인 경우:
- 애니메이션 버튼 5개 표시: 기본, 걷기, 먹기, 헤드버트(조류는 공격), 점프
- 각 버튼 클릭 시 해당 애니메이션 재생

'장바구니 담기' 버튼:
- CartContext의 addItem()으로 추가
- 로그인 안 된 상태이면 /login으로 이동

메인 페이지 디자인 컨셉을 유지해.
```

---

### 커스텀 캐릭터 제작 페이지 구성 수정

---
처음 계획 사람 3D and 2D 커스터마이징 -> 펫이라는 이름과 맞지 않는 것 같아 2D 삭제, 동물 3D 생성 

#### 0. 안티그래비티 3D 모델제작 가능여부 확인과 3d 사람캐릭터 제작 

---

##### 프롬프트 1 — 전체 구조 & 기본 레이아웃

```
React + Three.js(@react-three/fiber, @react-three/drei)로
Pet-Link 캐릭터 커스터마이저 페이지를 만들어줘.

【전체 레이아웃】
- 배경색: #f5a623 (주황색 도트 패턴)
- 상단: "PET LINK 캐릭터 커스텀" 로고 (왼쪽 상단)
- 왼쪽(35%): 3D 캐릭터 프리뷰 박스 + 이름 입력 필드
- 오른쪽(65%): 탭 패널 + 커스터마이징 옵션

【상단 탭 3개 - 캐릭터 종류 선택】
- 사람 3D (활성: #b5451b 배경, 흰 글씨)
- 사람 2D
→ 지금은 "3D사람" 탭만 구현

【왼쪽 프리뷰 박스】
- 회색 배경 둥근 사각형 카드
- Three.js Canvas로 3D 캐릭터 렌더링
- "마우스를 드래그해서 돌려보세요!" 안내 텍스트
- OrbitControls로 360도 회전 가능
- 하단: name 입력 필드 (영문, 숫자, -, _ 만 허용 / 최대 20자)

【오른쪽 서브탭 6개】
기본 | 얼굴 | 헤어 | 의상 | 소품 | 목소리
(활성 탭: #b5451b 배경, 흰 글씨 / 비활성: 베이지 #e8dac1)

【하단 고정 버튼】
"🛒 장바구니에 담기" (베이지/회색 둥근 버튼)

폰트: Noto Sans KR
카드 배경: rgba(255,255,255,0.85), border-radius: 1.5rem
```

---

##### 프롬프트 2 — 기본 탭 옵션

```
커스터마이저의 [기본] 탭 내용을 구현해줘.

【캐릭터 크기 (Size)】
- 슬라이더: 50% ~ 200%, 기본값 100%
- 라벨: "캐릭터 크기 (Size): 98%" (현재값 실시간 표시)
- 슬라이더 색: #b5451b

【피부색 (Skin Tone)】
- 슬라이더: 0~100, 기본값 10
- 라벨: "피부색 (Skin Tone):"
- 슬라이더 배경: 왼쪽(밝은 피부색 #FFE0C8) → 오른쪽(어두운 피부색 #3D1A0A) 그라디언트
- RGB 계산:
  r = round(255 - (255-74) * val/100)
  g = round(220 - (220-39) * val/100)
  b = round(185 - (185-22) * val/100)
- 3D 캐릭터 피부 색상에 실시간 반영

【체형 (Body Type)】
- 버튼 3개: 평균 / 길쭉 / 통통
- 선택된 버튼: #b5451b 배경, 흰 글씨
- 비선택: 베이지 배경, 갈색 글씨

【대명사 (Pronouns)】
- 버튼 3개: Her / Him / Them
- 동일한 토글 버튼 스타일
```

---

##### 프롬프트 3 — 얼굴 탭 옵션

```
커스터마이저의 [얼굴] 탭 내용을 구현해줘.

【눈 모양】
버튼 4개 (단일 선택):
- 기본 눈
- 눈웃음 (기본 선택)
- 감은 눈
- 초롱초롱 눈

【입 모양】
버튼 4개 (단일 선택):
- 없음
- 미소
- 무표정
- 벌린 입 (기본 선택)

【볼따구 (Blush)】
버튼 3개 (단일 선택):
- 없음
- 발그레
- 빗금 (기본 선택)

→ 각 선택에 따라 왼쪽 3D 캐릭터 얼굴이 실시간으로 업데이트되어야 함
→ 버튼 스타일: 선택 #b5451b / 비선택 베이지
```

---

##### 프롬프트 4 — 헤어 탭 옵션

```
커스터마이저의 [헤어] 탭 내용을 구현해줘.

【머리색 스펙트럼】
- 슬라이더: 0~360 (hue값)
- 배경: 풀 rainbow 그라디언트 (hsl 스펙트럼)
- 라벨: "머리색 스펙트럼:"

【머리 밝기】
- 슬라이더: 0~100
- 배경: 검정(#000) → 황금색(#c8a94a) → 흰색(#fff) 그라디언트
- 라벨: "머리 밝기:"

【앞머리】
버튼 5개 (단일 선택):
- 없음
- 뱅 헤어
- 곱슬
- 깻잎머리 (기본 선택)
- 바보털

【뒷머리】
버튼 8개 (단일 선택, 2줄):
1줄: 기본 / 양갈래 / 단발 / 긴 양갈래
2줄: 포니테일 / 버섯머리 / 긴 생머리 / 똥머리 (기본 선택)

→ 머리색과 밝기 슬라이더 변경 시 3D 캐릭터 헤어 색상 실시간 반영
```

---

##### 프롬프트 5 — 의상 탭 옵션

```
커스터마이저의 [의상] 탭 내용을 구현해줘.

【의상 스타일】
버튼 3개 (단일 선택):
- 오버올 (기본 선택)
- 드레스
- 상하의 분리

【옷 색상】
원형 색상 스와치 6개 (단일 선택):
- #c0392b (빨강)
- #f0b429 (노랑, 기본 선택)
- #6abf69 (초록)
- #7bafd4 (하늘)
- #b39ddb (보라)
- #f48fb1 (핑크)

→ 색상 스와치는 지름 40px 원형 버튼
→ 선택된 스와치: 테두리 3px #b5451b
→ 선택에 따라 3D 캐릭터 의상 색상 실시간 반영
```

---

##### 프롬프트 6 — 소품 탭 옵션

```
커스터마이저의 [소품] 탭 내용을 구현해줘.
(스크롤 가능한 패널)

【안경】
버튼 4개 (단일 선택):
- 없음
- 둥근 안경 (기본 선택)
- 네모 안경
- 반뿔테 안경

【안경 색상】
원형 색상 스와치 6개:
- #1a1a1a (검정, 기본)
- #e8e8e8 (흰/실버)
- #f0c020 (노랑)
- #c0392b (빨강)
- #2c5f8a (남색)
- #c9b8d8 (연보라)

【모자】
버튼 3개:
- 없음 (기본 선택)
- 버섯 모자
- 비니

【가방】
버튼 3개:
- 없음
- 백팩 (기본 선택)
- 손가방

【가방 색상】
(의상 색상과 동일한 6색 스와치 - 스크롤 아래 위치)
```

---

##### 프롬프트 7 — 목소리 탭 옵션

```
커스터마이저의 [목소리] 탭 내용을 구현해줘.

【목소리 유형 (Voice Type)】
버튼 4개 (2×2 그리드):
- 여성 1 (발랄한) ← 기본 선택
- 여성 2 (차분한)
- 남성 1 (차분한)
- 남성 2 (활기찬)

Google TTS voice 매핑:
- 여성 1: ko-KR-Standard-A
- 여성 2: ko-KR-Standard-C
- 남성 1: ko-KR-Standard-B
- 남성 2: ko-KR-Standard-D

【목소리 높낮이 (Pitch)】
- 슬라이더: -20 ~ +20, 기본값 0.0
- 라벨: "목소리 높낮이 (Pitch): 0.0" (실시간)
- 하단 힌트: "-20 (아주 낮음) --- 0 (기본) --- +20 (아주 높음)"

【말하기 속도 (Speed)】
- 슬라이더: 0.5x ~ 2.0x, 기본값 1.0x
- 라벨: "말하기 속도 (Speed): 1.0x" (실시간)
- 하단 힌트: "느리게 --- 보통 --- 빠르게"

【목소리 미리듣기 버튼】
- 크고 어두운 버튼 (#2d1a0a 배경, 흰 글씨)
- "🔊 목소리 미리듣기"
- 클릭 시: POST /api/tts { text: "안녕! 나는 [이름]이야!", voice, pitch, speed }
- 응답받은 base64 MP3를 Audio 객체로 재생
```

---

##### 프롬프트 8 — 3D 캐릭터 렌더러 (Three.js geometry)

```
위 커스터마이저의 왼쪽 3D 캐릭터를 Three.js로 구현해줘.
GLB 파일 없이 Three.js 기본 geometry로만 만들어.

【캐릭터 구조 (위에서 아래)】
1.  뒷머리       (CylinderGeometry or SphereGeometry 변형)
2.  앞머리       (선택된 스타일에 따라 shape 변경)
3.  머리 본체    (SphereGeometry, 약간 납작하게)
4.  눈           (선택된 눈 모양에 따라 다른 geometry)
5.  입           (선택된 입 모양에 따라 다른 geometry)
6.  볼따구       (원형 반투명 메시, blush 선택 시)
7.  안경         (TorusGeometry 또는 BoxGeometry)
8.  몸통         (CylinderGeometry, bodyType에 따라 scale 변화)
9.  의상 색상    (MeshStandardMaterial color)
10. 팔           (CylinderGeometry × 2)
11. 다리         (CylinderGeometry × 2)
12. 신발         (SphereGeometry 납작하게)
13. 모자         (선택 시 추가)
14. 가방         (선택 시 등 뒤 또는 옆에 추가)

【실시간 반영 필수 항목】
- skinTone → 머리/몸통/팔다리 MeshStandardMaterial.color
- hairColor + hairBrightness → 머리 material color (HSL 계산)
- bodyType → 몸통 scale 변화
    평균: (1, 1, 1)
    길쭉: (0.85, 1.2, 0.85)
    통통: (1.2, 0.9, 1.2)
- outfitStyle + outfitColor → 몸통 의상 레이어
- size → 전체 캐릭터 group.scale 조정
- 얼굴/헤어/소품 선택 → 해당 geometry/material 교체

모든 파츠를 하나의 Group에 묶어서 OrbitControls로 회전 가능하게.
```

---

*Pet-Link - 202601664 김태희 · gamteaha@gmail.com*

#### 1. 탭 아키텍처 및 상태 유지 정책

처음 기획되었던 2D 사람 캐릭터 컴포넌트(`Character3D.tsx`)를 절대 삭제하거나 덮어쓰지 않고, 3D 동물 캐릭터 뷰어(`Universal3DViewer.tsx`)를 **동등한 탭**으로 추가하는 구조입니다.

- **상단 탭 UI**: `[ 👤 나만의 캐릭터 ]` | `[ 🐱 고양이 ]` | `[ 🐶 강아지 ]`
- 탭 전환 간 상태가 날아가지 않도록 최상위 부모인 `page.tsx`에서 모든 탭의 상태를 한 번에 들고 있어야 합니다. (동물 커스텀하다가 사람 탭으로 넘어갔다 와도 설정값이 남아있어야 함)

---

#### 2. 상태 관리 패턴 (Top-Down 제어)

커스텀 뷰어의 렌더링 동기화가 깨지는 버그를 막기 위해, 컴포넌트 상태 관리는 무조건 **부모가 소유하고 자식은 읽기만 하는(Controlled Component) 패턴**을 따릅니다.

##### 부모 (`app/customize/page.tsx`)
아래 상태들을 100% 소유합니다.
```tsx
// 사람 캐릭터용 상태
const [skinToneValue, setSkinToneValue] = useState(50);
const [bodyType, setBodyType] = useState('normal');

// 동물 캐릭터용 상태
const [furColor, setFurColor] = useState('#A89BC0');
const [eyeShape, setEyeShape] = useState('round');
const [accessory, setAccessory] = useState('none');

// 공통 상태
const [characterSize, setCharacterSize] = useState(100); // 50% ~ 200%
const [name, setName] = useState('');
```

##### 자식 (`Universal3DViewer` / `Character3D`)
내부적으로 State를 절대 가지지 않으며, 부모가 넘겨준 Props만 받아서 순수하게 렌더링만 담당합니다.

---

#### 3. 세부 커스텀 옵션 명세

##### 🐱/🐶 고양이 & 강아지 (동물 탭)
- **3D 렌더링 (`Universal3DViewer`)**: `cat.glb`, `dog.glb` 파일을 로드. 마우스 드래그로 360도 회전할 수 있도록 `OrbitControls` 필수 적용.
- **털 색상(furColor)**: 컬러 팔레트 동그라미 6개를 나열하고 클릭 시 상태 변경.
  - 라벤더(`#A89BC0`), 오렌지(`#E8956D`), 흰색(`#F0EDE8`), 검정(`#3D3D3D`), 갈색(`#C8A882`), 회색(`#9B9B9B`)
- **눈 모양(eyeShape)**: `round`(기본), `sleepy`(반쯤 감은 눈), `wide`(반짝이는 큰 눈)
- **악세서리(accessory)**: `none`, `ribbon`, `hat`, `necklace`, `glasses`

##### 👤 나만의 캐릭터 (사람 탭)
- **피부색 그라디언트 슬라이더**: 0~100 사이의 슬라이더 값을 hex 코드로 변환하는 공식을 적용합니다.
  ```typescript
  function getSkinColorHex(value: number): string {
    const r = Math.round(255 - (255 - 74) * (value / 100));
    const g = Math.round(224 - (224 - 46) * (value / 100));
    const b = Math.round(196 - (196 - 27) * (value / 100));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  ```
- **체형(bodyType)**: `normal`, `tall`, `chubby`

---

#### 4. 🚨 치명적 렌더링 버그 수정 (반드시 적용할 것)

과거 개발 시 캐릭터 크기(`characterSize`) 슬라이더를 150% 이상 키웠을 때 발생했던 두 가지 시각적 버그 방지 로직입니다.

### 1) 머리 잘림 현상 방지
컨테이너의 사이즈가 고정되어 있어 크기를 키우면 위쪽 머리가 잘렸습니다.
- **해결책**: 3D Canvas 및 상위 컨테이너에 `overflow: visible` 속성을 부여하고, 사이즈 조절 시 내부 모델의 `scale`뿐만 아니라 부모 컨테이너의 `width/height`도 비율에 맞춰 유동적으로 늘어나게 연동해야 합니다.

### 2) 이름표(말풍선) 비율 불일치
캐릭터 본체는 200% 커졌는데, 머리 위에 뜨는 이름표는 기존 크기(100%) 그대로 남아 따로 노는 버그가 있었습니다.
- **해결책**: 이름표 컴포넌트(`BubbleOverlay` 또는 전용 `NameTag`)에도 `characterSize` prop을 반드시 같이 넘깁니다. 
- 스타일 적용 시 `fontSize`, `padding`, `borderRadius`를 단순히 `px`로 고정하지 않고 `(basePx * characterSize / 100) + 'px'` 공식을 사용해 **캐릭터가 커지면 폰트와 말풍선 둥글기도 비례해서 커지도록** 적용합니다.

---

#### 5. 저장 및 장바구니 담기 데이터 규약

하단의 **[ 🛒 장바구니에 담기 ]** 버튼을 누르면 부모 컴포넌트가 들고 있던 상태들을 모아서 아래 구조의 JSON으로 변환한 뒤 `CartContext`의 `addItem()`으로 전송합니다.

**동물 캐릭터 저장 규약:**
```json
{
  "id": "animal_174000000",
  "name": "입력한 이름",
  "price": 40,
  "emoji": "🐱",
  "category": "pet",
  "quantity": 1,
  "config": {
    "type": "animal",
    "species": "cat",
    "furColor": "#A89BC0",
    "eyeShape": "round",
    "accessory": "none",
    "size": 150
  }
}
```

**사람 캐릭터 저장 규약:**
```json
{
  "id": "char_174000000",
  "name": "입력한 이름",
  "price": 50,
  "emoji": "👤",
  "category": "pet",
  "quantity": 1,
  "config": {
    "type": "character",
    "skinToneValue": 50,
    "bodyType": "normal",
    "size": 120
  }
}
```

이 규칙을 철저히 지키면 캐릭터 크기 변형 버그, 탭 이동 시 초기화 버그, 장바구니 전달 시 데이터 누락 버그를 원천 차단할 수 있습니다.

프롬프트:

```
app/customize/page.tsx를 만들어줘.
사람 캐릭터와 고양이/강아지 중 하나를 선택해서 커스텀하는 페이지야.

상단 탭: '나만의 캐릭터' | '고양이' | '강아지'
※ 주의: 사람 캐릭터(Character3D)는 삭제하지 않고 그대로 유지한 채로
   고양이/강아지 탭을 "추가"하는 구조다. (사람 캐릭터를 동물로 대체하는 것이 아님)

[나만의 캐릭터 탭]
왼쪽 프리뷰 영역: Character3D 컴포넌트 (기존 사람 캐릭터)
오른쪽 커스텀 옵션:
- 피부 톤 슬라이더 (0~100)
- 체형 선택 (normal / tall / chubby)
- 헤어 선택
- 의상 선택
- 이름 입력 (영문, 숫자, -, _ 만 허용, 최대 20자)

저장 데이터 구조:
{
  "type": "character",
  "name": "...",
  "skinToneValue": 50,
  "bodyType": "normal",
  ...
}

[고양이 / 강아지 탭]
왼쪽 프리뷰: Universal3DViewer (해당 species, cat.glb / dog.glb 사용)
오른쪽 커스텀 옵션:
- 털 색상 선택 (색상 팔레트 6종: 라벤더 #A89BC0, 오렌지 #E8956D, 흰색 #F0EDE8,
  검정 #3D3D3D, 갈색 #C8A882, 회색 #9B9B9B)
- 눈 모양 선택: round(기본) / sleepy(반쯤 감은 눈) / wide(반짝이는 큰 눈)
- 악세서리 선택: 없음 / 리본 / 모자 / 목걸이 / 안경
- 이름 입력

저장 데이터 구조:
{
  "type": "animal",
  "species": "cat" 또는 "dog",
  "furColor": "#A89BC0",
  "eyeShape": "round",
  "accessory": "none",
  "name": "..."
}

미리보기 캔버스는 마우스 드래그로 회전 가능하게(OrbitControls) 해줘.
'장바구니 담기' 버튼: CartContext에 config 포함하여 추가
메인 페이지 디자인 컨셉 유지.
```

> ⚠️ 추가 설명: 처음에는 동물 캐릭터를 순수 SVG(2D 일러스트)로 직접 그리는 방식으로
> 설계했었으나, "3D로 만들고 싶다"는 요구사항에 따라 무료 CC0 3D 모델(`quaternius_cc0-cat-802.glb`)을
> Three.js로 렌더링하는 방식으로 최종 변경했다. (= 위 Universal3DViewer 방식과 동일 컴포넌트 재사용)
> 이 과정에서 "사람 캐릭터를 지우고 동물로 교체"가 아니라 "사람 캐릭터는 유지하고 동물을 추가"하는 것이
> 정확한 요구사항이었음을 한 차례 더 명확히 했다.

---

#### 🔊 Pet-Link TTS & 전자음 시스템 제작 프롬프트 시리즈

> Google Cloud TTS(사람 목소리)와 Web Audio API(데덴네 전자음) 두 가지를 구현하는 프롬프트입니다.
> 순서대로 넣어주세요.

---

##### 프롬프트 1 — API Route 구성 (`/api/tts`)

```
Next.js App Router에서 Google Cloud TTS API를 호출하는
서버사이드 API Route를 만들어줘.

【파일 위치】
app/api/tts/route.ts

【Request Body 타입】
{
  text: string;       // 변환할 텍스트
  voice?: string;     // Google TTS voice 이름 (기본값: 'ko-KR-Standard-A')
  pitch?: number;     // 높낮이 -20 ~ +20 (기본값: 0)
  speed?: number;     // 말하기 속도 0.5 ~ 2.0 (기본값: 1.0)
}

【Google TTS API 호출】
POST https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}

요청 body:
{
  input: { text },
  voice: {
    languageCode: 'ko-KR',
    name: voice   // 예: 'ko-KR-Standard-A'
  },
  audioConfig: {
    audioEncoding: 'MP3',
    pitch: pitch,
    speakingRate: speed
  }
}

【응답】
Google에서 { audioContent: "base64_mp3_string" } 반환
→ 그대로 클라이언트에 JSON으로 전달: Response.json({ audioContent })

【에러 처리】
- API 키 없음: 500 + { error: 'TTS API key not configured' }
- Google 응답 실패: 400 + { error: data.error.message }

【환경변수】
GOOGLE_TTS_API_KEY=AIza...  (서버에서만 사용, NEXT_PUBLIC_ 붙이지 말 것)
```

---

##### 프롬프트 2 — 목소리 탭 클라이언트 연동

```
커스터마이저 [목소리] 탭에서 "🔊 목소리 미리듣기" 버튼 클릭 시
/api/tts를 호출해서 사람 목소리를 재생하는 로직을 구현해줘.

【호출 함수】
async function previewVoice() {
  const name = petName || '나의 캐릭터';
  const previewText = `안녕! 나는 ${name}이야! 잘 부탁해!`;

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: previewText,
      voice: selectedVoice,   // 예: 'ko-KR-Standard-A'
      pitch: voicePitch,      // -20 ~ +20
      speed: voiceSpeed       // 0.5 ~ 2.0
    })
  });

  const { audioContent } = await res.json();

  // base64 MP3 → Audio 재생
  const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
  audio.play();
}

【voice 매핑 (목소리 유형 버튼 → Google voice 이름)】
const VOICE_MAP = {
  'female_bright':  'ko-KR-Standard-A',   // 여성 1 (발랄한)
  'female_calm':    'ko-KR-Standard-C',   // 여성 2 (차분한)
  'male_calm':      'ko-KR-Standard-B',   // 남성 1 (차분한)
  'male_bright':    'ko-KR-Standard-D',   // 남성 2 (활기찬)
};

【UI 상태】
- 버튼 클릭 시 로딩 스피너 표시 ("생성 중...")
- 재생 시작 시 스피너 제거
- 에러 시 "목소리 생성에 실패했어요 😢" 토스트 표시

【주의】
- 이전 Audio 인스턴스가 재생 중이면 stop() 후 새로 재생
- 버튼 연타 방지: 재생 중에는 버튼 disabled 처리
```

---

##### 프롬프트 3 — 데덴네 전자음 생성기 (Web Audio API)

```
데덴네 말풍선 대사를 전자음(전자 삐빅 소리)으로 변환해서 재생하는
유틸리티 함수를 만들어줘. GLB나 WAV 파일 없이 Web Audio API만 사용.

【파일 위치】
utils/dedenneSynth.ts

【핵심 아이디어】
- 텍스트 한 글자 한 글자를 짧은 비프음 1개로 매핑
- 글자마다 주파수(pitch)를 조금씩 다르게 줘서 "말하는 느낌" 연출
- 공백/구두점은 짧은 무음(silence)으로 처리

【구현 함수】
export async function playDedenneVoice(text: string): Promise<void> {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContext();

  // 글자별 주파수 매핑 (한글 음절 → 주파수)
  // 기본 주파수 범위: 800Hz ~ 1400Hz (귀엽고 높은 전자음)
  function charToFreq(char: string, index: number): number {
    const code = char.charCodeAt(0);
    const base = 900;
    const range = 400;
    return base + (code % range) + (index % 3) * 50;
  }

  let startTime = ctx.currentTime;
  const NOTE_DURATION = 0.08;   // 한 글자당 0.08초
  const SILENCE = 0.03;         // 글자 사이 무음 간격
  const SPACE_SILENCE = 0.15;   // 공백 무음

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === ' ' || char === '\n') {
      startTime += SPACE_SILENCE;
      continue;
    }
    if ('!?.~,'.includes(char)) {
      startTime += SILENCE * 2;
      continue;
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 파형: 'square'로 전자음 느낌, 'sine'으로 부드러운 느낌
    osc.type = 'square';
    osc.frequency.setValueAtTime(charToFreq(char, i), startTime);

    // 음량 envelope (Attack → Decay)
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.01);  // attack
    gainNode.gain.linearRampToValueAtTime(0, startTime + NOTE_DURATION); // decay

    osc.start(startTime);
    osc.stop(startTime + NOTE_DURATION);

    startTime += NOTE_DURATION + SILENCE;
  }
}

【호출 예시 (DedennePet.tsx에서)】
import { playDedenneVoice } from '@/utils/dedenneSynth';

// 말풍선 표시 시 함께 호출
function showMessage(category: string) {
  const msg = pickRandom(MESSAGES[category]);
  setCurrentMessage(msg);
  setShowBubble(true);
  playDedenneVoice(msg);  // 전자음 재생
  setTimeout(() => setShowBubble(false), 2500);
}
```

---

##### 프롬프트 4 — 전자음 세부 튜닝 옵션

```
dedenneSynth.ts의 전자음을 더 귀엽고 캐릭터답게 튜닝해줘.

【파형별 용도 분리】
const WAVEFORM_MAP: Record<string, OscillatorType> = {
  greet:   'sine',    // 인사: 부드럽고 따뜻하게
  idle:    'sine',    // 휴식: 나른하게
  pat:     'sine',    // 쓰다듬기: 기분 좋게
  happy:   'square',  // 기쁨: 통통 튀는 전자음
  excited: 'square',  // 신남: 높고 빠르게
  swing:   'sawtooth',// 흔들림: 거칠게
  run:     'square',  // 달리기: 빠르고 경쾌하게
  explore: 'triangle',// 탐색: 살짝 몽환적으로
};

【상태별 속도 조정】
const SPEED_MAP: Record<string, number> = {
  excited: 0.05,  // 신남: 더 빠르게
  happy:   0.07,
  greet:   0.09,
  idle:    0.10,
  pat:     0.08,
  swing:   0.06,
  run:     0.05,
  explore: 0.11,
};

【주파수 범위 조정】
const FREQ_MAP: Record<string, [number, number]> = {
  greet:   [900,  1300],  // 중고음
  excited: [1100, 1600],  // 높은 음
  happy:   [1000, 1400],
  idle:    [700,  1000],  // 낮고 나른하게
  pat:     [950,  1250],
  swing:   [600,  1100],
  run:     [1000, 1500],
  explore: [800,  1200],
};

【업그레이드된 playDedenneVoice 시그니처】
export async function playDedenneVoice(
  text: string,
  category: string = 'idle',  // 상태 카테고리
  volume: number = 0.15        // 0.0 ~ 1.0
): Promise<void>

【추가: 음량 전역 뮤트 지원】
// 사용자가 소리 끄기 원할 경우
let isMuted = false;
export function setDedenneMuted(muted: boolean) { isMuted = muted; }

// playDedenneVoice 내부 첫 줄에 추가
if (isMuted) return;
```

---

##### 프롬프트 5 — 뮤트 버튼 UI 컴포넌트

```
DedennePet 컴포넌트 안에 소리 켜기/끄기 버튼을 추가해줘.

【위치】
- 데덴네 본체 우측 상단 모서리에 작은 아이콘 버튼
- 항상 표시 (펫 위에 오버레이)

【UI】
- 🔊 (소리 켜짐) / 🔇 (소리 꺼짐) 토글
- 버튼 크기: 24px × 24px
- 배경: rgba(255,255,255,0.7) 원형
- 클릭 시:
  setDedenneMuted(!isMuted)  // dedenneSynth.ts 뮤트 전역 상태 변경
  localStorage.setItem('dedenne_muted', String(!isMuted))  // 설정 유지

【초기화】
useEffect(() => {
  const saved = localStorage.getItem('dedenne_muted');
  if (saved === 'true') setDedenneMuted(true);
}, []);
```

---

##### 📋 전체 흐름 요약

```
[사람 목소리 흐름]
커스터마이저 목소리 탭
  → "🔊 목소리 미리듣기" 버튼 클릭
  → POST /api/tts { text, voice, pitch, speed }
  → Google Cloud TTS API 호출 (서버)
  → base64 MP3 반환
  → new Audio(data:audio/mp3;base64,...).play()

[데덴네 전자음 흐름]
DedennePet 말풍선 표시 시
  → showMessage(category) 호출
  → playDedenneVoice(text, category) 호출
  → Web Audio API로 글자별 비프음 생성
  → OscillatorNode → GainNode → AudioContext.destination
  → 전자음 재생 (파일 없이 실시간 생성)
```

---

##### ⚠️ 주의사항

```
1. AudioContext 자동재생 정책
   → 브라우저는 사용자 인터랙션(클릭 등) 없이 AudioContext 생성을 차단함
   → 반드시 클릭/탭 이벤트 핸들러 내에서 ctx.resume() 후 재생

2. AudioContext 중복 생성 방지
   → playDedenneVoice 내부에서 매번 new AudioContext() 생성 시 메모리 누수
   → 전역 싱글톤으로 유지:
     let globalCtx: AudioContext | null = null;
     function getCtx() {
       if (!globalCtx) globalCtx = new AudioContext();
       return globalCtx;
     }

3. SSR 환경 (Next.js)
   → window.AudioContext는 서버에서 존재하지 않음
   → typeof window !== 'undefined' 체크 후 사용

4. GOOGLE_TTS_API_KEY 보안
   → 반드시 서버(API Route)에서만 사용
   → NEXT_PUBLIC_ 접두사 절대 붙이지 말 것
   → .env.local에만 보관, .gitignore 확인
```

---

*Pet-Link - 202601664 김태희 · gamteaha@gmail.com*

### 장바구니 페이지 구성

프롬프트:

```
app/cart/page.tsx를 만들어줘.
로그인하지 않은 상태로 접근하면 /login으로 redirect해.

레이아웃:
- 왼쪽(2/3): CartContext의 items를 카드 형식으로 나열
  카드 구성: 이모지, 이름, 가격(치즈 N개), 수량 조절, 삭제(X) 버튼
- 오른쪽(1/3, sticky): 주문 요약
  - 총 아이템 수
  - 총 치즈 합계
  - '전체 삭제' 버튼
  - '치즈로 결제하기' 버튼

빈 장바구니일 때:
- "아직 담긴 항목이 없습니다" 메시지
- '둘러보기' 버튼 → / 이동

메인 페이지 디자인 컨셉 유지.
```

---

### 치즈 결제 구현

프롬프트:

```
장바구니 페이지의 '치즈로 결제하기' 버튼에 기능을 연결해줘.

동작 순서:
1. 로그인 확인 → 미로그인 시 /login 이동
2. 잔액 부족이면 "치즈가 부족합니다. 충전하러 가시겠어요?" 모달 표시
3. 확인 모달:
   "총 N개 아이템, 치즈 M개를 사용하시겠습니까?"
   [취소] [결제하기]
4. 확인 클릭 시:
   - CheeseContext의 spendCheese(totalCheese, '아이템 구매') 호출
   - orders 테이블에 주문 INSERT
   - order_items 테이블에 항목 INSERT
   - user_inventory 각 아이템 수량 upsert (1회 구매 = 수량 +10)
     단, 펫(category='pet')은 수량 +1
   - items 테이블의 sales(판매량) 컬럼을 구매 수량만큼 증가시켜줘
     ⚠️ 추가: 관리자 아이템 대시보드에서 '판매량' 컬럼을 표시하려면 필요
   - CartContext clearCart()
   - /my-pets 페이지로 이동
5. 처리 중 로딩 스피너 표시
6. 실패 시 토스트 에러 메시지
```

---

### 치즈 충전 페이지 구성

프롬프트:

```
app/charge/page.tsx를 만들어줘.
로그인하지 않은 상태로 접근하면 /login으로 redirect해.

충전 패키지 4종:
- 10개 / 10,000원
- 30+2개 / 30,000원
- 50+5개 / 50,000원
- 100+15개 / 100,000원

각 패키지 카드: 치즈 수량(보너스 포함), 금액, '충전하기' 버튼

'충전하기' 버튼 클릭 시 토스페이먼츠 결제창 호출:
- clientKey: NEXT_PUBLIC_TOSS_CLIENT_KEY
- amount: { currency: 'KRW', value: 패키지금액 }
- orderId: 'CHEESE-${Date.now()}'
- orderName: '치즈 N개 충전'
- successUrl: '${origin}/payment/success?cheese=충전량'
- failUrl: '${origin}/payment/fail'

메인 페이지 디자인 컨셉 유지.
```

---

### 결제 성공/실패 페이지 구성

프롬프트:

```
app/payment/success/page.tsx를 만들어줘.
URL 파라미터: paymentKey, orderId, amount, cheese

처리 순서:
1. 토스페이먼츠 결제 승인 API 호출 (서버 액션으로 구현)
   POST https://api.tosspayments.com/v1/payments/confirm
   Authorization: Basic base64(TOSS_SECRET_KEY:)
   body: { paymentKey, orderId, amount }
2. 승인 성공 시 CheeseContext의 addCheese(cheese, '치즈 충전') 호출
3. orders 테이블에 INSERT (toss_payment_key, toss_order_id 컬럼도 함께 저장)
4. /my-pets 페이지로 이동

실패 시 /payment/fail로 이동.
---
app/payment/fail/page.tsx도 만들어줘.
URL 파라미터: code, message, orderId
- 실패 아이콘, "결제에 실패했습니다" 메시지, 실패 사유 표시
- [장바구니로 돌아가기] → /cart
- [메인으로 이동] → /
```

---

### 내 펫 페이지 구성

프롬프트:

```
app/my-pets/page.tsx를 만들어줘.
로그인하지 않은 상태로 접근하면 /login으로 redirect해.

user_pets 테이블에서 로그인한 사용자의 펫 목록을 불러와.
user_inventory에서 아이템 목록도 함께 불러와.

각 펫 카드 구성:
- 펫 이름, 종류(species 또는 '나만의 캐릭터')
- 레벨, 호감도 바
- 'PC 적용하기' 버튼

'PC 적용하기' 버튼 클릭 시:
- JSZip으로 /releases/custom-pet-player.zip 다운로드
- character.petlink 파일로 펫 config를 ZIP 안에 주입
- [펫이름]_player.zip으로 다운로드

아이템 인벤토리 섹션:
- user_inventory JOIN items 로 현재 보유 아이템 목록 표시
- 각 아이템: 이모지, 이름, 수량

펫이 없을 때: "아직 입양한 펫이 없습니다" 메시지 + '상점으로 이동' 버튼
메인 페이지 디자인 컨셉 유지.
```

### ⚠️ (추가) ZIP 다운로드 보안 — 환경변수 파일 제외 처리 (치명적)

> 'PC 적용하기' 시 JSZip으로 /releases/custom-pet-player.zip을 읽어
> character.petlink를 주입한 뒤 재압축하는 과정에서, 빌드 산출물 폴더에
> .env.local이나 서버 전용 키(SUPABASE_SERVICE_ROLE_KEY, TOSS_SECRET_KEY 등)가
> 실수로 포함되어 사용자에게 그대로 배포될 뻔한 위험이 있었다. 이는 즉시
> 키 유출로 이어지는 치명적 보안 사고이므로, 압축 로직에 반드시
> 화이트리스트/블랙리스트 필터링을 명시해야 한다.

프롬프트:

```
'PC 적용하기' 다운로드 로직(JSZip으로 custom-pet-player.zip을 읽고
character.petlink를 주입해 재압축하는 부분)에 보안 검증 단계를 추가해줘.

필수 조건:
- 원본 release zip(custom-pet-player.zip) 자체에 .env, .env.local,
  .env.production 등 환경변수 파일이나 .key, .pem, service-role 관련
  파일이 절대 포함되어 있으면 안 된다. 빌드/배포 스크립트 단계에서
  release zip을 생성할 때 명시적으로 제외(exclude) 목록에 추가해줘.
- 런타임에서도 안전장치로, zip을 읽어 들인 후 파일 목록을 순회하면서
  파일명에 '.env', 'service-role', 'secret', '.pem', '.key' 등의
  패턴이 포함된 항목이 있으면 재압축 대상에서 강제로 제외하고
  콘솔에 경고 로그를 남기는 필터링 로직을 추가해줘.
- 최종적으로 사용자에게 전달되는 zip 안에는 PC 앱 실행에 필요한
  파일(electron 빌드 산출물, run_pet.bat, character.petlink)만
  포함되어야 한다.
- 이 검증 로직은 release zip을 만드는 배포 스크립트와, 사용자가
  다운로드할 때 호출되는 API route(예: /api/download-pet 또는
  PC 적용하기 클릭 시 실행되는 클라이언트 로직) 양쪽에 모두 적용해줘.

⚠️ 이 항목은 이후 PC 앱 빌드/배포 스크립트를 수정할 때마다
반드시 재검증할 것. release zip의 내용물을 한 번이라도 직접 풀어서
.env 계열 파일이 없는지 육안으로 확인하는 절차를 검증 순서에도 추가한다.
```

### ⚠️ (추가) 펫 가방(인벤토리) 아이템 이동 — 로컬 상태 우선, 일괄 저장 방식

> '내 펫' 페이지에서 보유 아이템을 펫의 가방으로 옮기는 기능을
> 추가하면서, 처음에는 아이템을 하나 옮길 때마다 즉시 Supabase
> user_inventory를 UPDATE하는 방식으로 구현했다. 그런데 사용자가
> 여러 아이템을 연속으로 빠르게 옮길 경우 매번 네트워크 요청이 발생해
> 화면이 버벅이고, 동시에 여러 요청이 겹치며 수량이 꼬이는 문제가
> 발생했다. 이를 막기 위해 "화면(로컬 state)에서는 자유롭게 옮기고,
> '저장' 버튼을 눌렀을 때만 한 번에 DB와 .petlink 파일에 반영"하는
> 방식으로 변경해야 한다.

프롬프트:

```
'내 펫' 페이지의 펫 가방(인벤토리) 관리 UI를 아래 방식으로 구현해줘.

상태 관리:
- 페이지 진입 시 user_inventory를 한 번만 조회해서 로컬 state
  (예: localInventory)로 보관한다.
- 펫 가방으로 옮길 아이템 목록도 별도 로컬 state(예: petBagItems)로
  관리한다.
- 사용자가 아이템을 펫 가방으로 드래그하거나 '가방에 넣기' 버튼을
  누르면, Supabase를 즉시 호출하지 않고 localInventory와
  petBagItems 두 로컬 state만 업데이트한다 (UI는 즉각 반응하되
  DB 호출은 발생하지 않음).
- 가방에서 다시 빼는 동작도 동일하게 로컬 state에서만 처리한다.

저장 버튼:
- 화면 하단(또는 가방 영역 옆)에 '저장' 버튼을 고정 배치한다.
- 로컬 state가 최초 로드 시점과 달라졌을 때만(dirty 상태) 버튼을
  활성화하고, 변경사항이 없으면 비활성화(disabled) 처리한다.
- '저장' 버튼 클릭 시에만 아래 작업을 한 번에 일괄 처리한다:
  1. petBagItems 최종 상태를 기준으로 user_inventory 테이블을
     일괄 upsert (여러 행을 한 번의 요청으로 처리, 개별 아이템마다
     별도 요청을 보내지 않도록 batch upsert 사용)
  2. /api/sync-pet 또는 별도 API route를 호출해 character.petlink에
     해당하는 펫의 가방 구성을 함께 갱신 (PC 앱과의 동기화)
  3. 저장 중에는 버튼에 로딩 스피너 표시, 완료 후 토스트로
     "저장되었습니다" 안내
  4. 저장 실패 시 로컬 state를 롤백하지 않고, 에러 토스트만 띄워
     사용자가 재시도할 수 있게 한다 (입력한 내용이 날아가지 않도록).

⚠️ 주의: 페이지를 벗어나려 할 때(다른 페이지 이동, 새로고침) 저장하지
않은 변경사항이 있다면 브라우저 기본 확인창(beforeunload)으로
"저장하지 않은 변경사항이 있습니다" 경고를 띄워줘.
```

---

### ⚠️ (추가) `.petlink` 파일 구조 및 PC 앱 동기화 방식

> 웹에서 설정한 커스텀 데이터(크기, 눈 모양, 악세서리 등)가 PC 데스크탑 앱에서도
> 동일하게 보이도록 동기화 작업을 진행했다. 핵심 설계는 다음과 같다.

프롬프트:

```
PC 데스크탑 앱(custom-pet-player.zip)을 새로 빌드해서
웹에서 만든 캐릭터 커스텀 기능(크기 조절, 눈 모양, 이름표 등)이
PC 앱에서도 동일하게 렌더링되도록 동기화해줘.

설계 방침:
- 캐릭터의 세부 외형 데이터(눈 모양, 헤어, 크기 등)는 Supabase DB 스키마에
  종속시키지 않고, 다운로드되는 압축 파일 내부의 character.petlink 라는
  JSON 텍스트 파일에 직접 저장한다.
- PC 앱(Electron)은 이 .petlink 파일을 읽어서 렌더링한다.
- 이렇게 하면 향후 꼬리 모양, 새로운 악세서리 등이 추가되어도
  Supabase DB 스키마를 변경할 필요 없이 유연하게 확장할 수 있다.
- Supabase DB(user_pets.config, user_inventory 등)는
  치즈(재화) 이력과 구매 내역, 보유 아이템 수량 등 '거래/계정' 데이터만 담당한다.

PC 앱 전용 정적 빌드(Static Export)를 별도로 수행해서
기존 다운로드 파일(custom-pet-player.zip)을 최신 코드 기준으로 덮어쓴다.

확인 방법:
1. 웹 커스텀 화면에서 원하는 크기(최대 150%)와 눈 모양으로 캐릭터를 꾸민다.
2. 장바구니 담고 결제 후 [나의 펫] 페이지로 이동한다.
3. 다운로드한 zip 압축을 풀고 run_pet.bat 또는 launch.vbs를 실행한다.
4. 바탕화면에 나타나는 캐릭터가 크기, 눈 모양, 이름표 비율까지
   웹과 동일한지 확인한다.
```

---

### API Routes 구현

프롬프트:

```
아래 API Route 파일들을 만들어줘.

1. app/api/payment/confirm/route.ts
   POST 요청, body: { paymentKey, orderId, amount }
   토스페이먼츠 결제 승인 API를 서버에서 호출해
   Authorization: Basic base64(TOSS_SECRET_KEY:)
   성공하면 토스 응답을 그대로 반환, 실패하면 400 에러

2. app/api/sync-pet/route.ts
   POST 요청, body: { petId, petData }
   SUPABASE_SERVICE_ROLE_KEY로 RLS 우회해서
   user_pets 테이블의 config를 petData로 덮어써줘

3. app/api/inventory/sync/route.ts
   POST 요청, body: { userId }
   SUPABASE_SERVICE_ROLE_KEY로 user_inventory 전체 조회 후
   홈 디렉토리 .petlink/pet_inventory.json 파일로 저장해
```

---

### CustomPet (데스크탑 앱용 펫 컴포넌트) 구현

프롬프트:

```
app/components/CustomPet.tsx를 만들어줘.
이건 Electron 데스크탑 앱의 /desktop 페이지에서 사용하는 컴포넌트야.

props:
- previewConfig: any (미리보기용, 없으면 로컬 파일에서 로드)

내부 상태:
- config: 펫 설정 (character.petlink 파일 또는 localStorage에서 로드)
- state: 'idle' | 'walk' | 'eat' | 'wash' | 'startled'
- direction: 1 | -1
- isDragging: boolean

물리 엔진 (setInterval 60fps):
- state='walk'이면 direction 방향으로 x += 2.5
- 화면 가장자리 100px에서 direction 반전
- 화면 하단보다 위에 있으면 중력(y += 1.5) 적용
- 바닥(window.innerHeight - 250)에 닿으면 y 고정

AI 행동 루프:
- 랜덤하게 idle ↔ walk 전환 (walk: 2~5초, idle: 1~3초)

펫 렌더링:
- config.type === 'animal'이면 Animal3DCharacter 사용
- config.type === 'character'이면 Character3D 사용

클릭 시 말풍선 표시 (랜덤 메시지 2초)
우클릭 시 electronAPI.showContextMenu() 호출
마우스 호버 시 electronAPI.setIgnoreMouseEvents(false)
마우스 이탈 시 electronAPI.setIgnoreMouseEvents(true)

Framer Motion drag 사용.
전체 컨테이너: position fixed, zIndex 9999, 250x250px
```

> ⚠️ 추가: 데스크탑 펫 모드에서는 메인 페이지의 `CharacterWithEyes`(우클릭 인벤토리,
> 시선 추적) 로직이 별도 컴포넌트 트리(Electron 전용 `/desktop` 페이지)로 분리되어 있어
> 이벤트가 자동으로 공유되지 않는다. 우클릭 인벤토리 / 시선 추적 / 드래그 먹이주기 기능을
> `CustomPet.tsx`에도 동일하게 연결해야 데스크탑 펫 모드에서도 정상 동작한다.
> (메인 페이지에서만 동작하고 데스크탑 펫 모드에서는 우클릭이 안 먹히는 버그가
> 실제로 발생했던 부분이므로, 두 컴포넌트 모두에 이벤트 핸들러가 연결되어 있는지
> 반드시 교차 확인할 것)

---

### 데스크탑 페이지 구성

프롬프트:

```
app/desktop/page.tsx를 만들어줘.
이 페이지는 Electron 앱이 로드하는 전용 페이지야.

- 배경: 완전 투명 (background: transparent)
- CustomPet 컴포넌트만 렌더링
- SSR 비활성화 (dynamic import with ssr: false)
- 다른 UI 요소 없음
```

---

### 관리자 레이아웃 및 접근 제어 구현

프롬프트:

```
app/admin/layout.tsx를 만들어줘.
관리자 이메일 화이트리스트: ['gamteaha@gmail.com']
해당 이메일이 아니면 서버에서 /로 redirect해.
관리자 전용 사이드바 레이아웃 구성 (메뉴: 대시보드, 회원관리, 치즈관리, 주문내역, 아이템관리, 통계, 로그).
```

---

### 관리자 대시보드 구현

프롬프트:

```
app/admin/page.tsx를 만들어줘.

집계 카드 4개:
- 전체 가입자 수 (profiles 테이블)
- 전체 펫 수 (user_pets 테이블)
- 이번달 매출 (orders WHERE total_price >= 1000 AND ordered_at >= 이번달 1일)
- 누적 매출 (orders WHERE total_price >= 1000)

치즈 지급/차감 기능:
- 회원 이메일 검색
- 치즈 수량 입력, '지급' 또는 '차감' 버튼
- profiles cheese_balance 업데이트 + cheese_logs INSERT

최근 주문 목록 (orders 테이블 최신 10건, orders와 profiles를 JOIN해서
  주문자 표시 이름과 이메일도 함께 표시. 단 이 JOIN이 동작하려면
  Supabase 스키마에 orders.user_id → profiles.id 외래 키가 선언되어 있어야 함
  — 위 "Supabase 프로젝트 생성 및 스키마 구성" 단계의 fk_orders_profiles 참고)

관리자 디자인: 배경 #fdf6e3, 카드 흰색, 텍스트 #4a2e1b
```

### ⚠️ (추가) 관리자 — 매출 내역 표기 개선 (치즈 충전 vs 아이템 구매 구분)

> 관리자 대시보드 및 주문 내역 페이지에서 '치즈 충전(실제 결제,
> 토스페이먼츠)'과 '치즈로 아이템을 구매'한 거래가 동일하게 '치즈'로만
> 표기되어 실제 매출(현금 흐름)과 게임 내 재화 소비를 구분할 수 없는
> 문제가 있었다. orders 테이블에 거래 유형을 구분할 컬럼이 필요하다.

프롬프트:

```
orders 테이블에 거래 유형을 구분하는 컬럼을 추가해줘.

ALTER TABLE orders ADD COLUMN order_type text DEFAULT 'item_purchase';
-- order_type 값: 'item_purchase'(치즈로 아이템 구매) 또는
-- 'cheese_charge'(토스페이먼츠로 치즈 충전, 실제 현금 결제)

이미 작성된 두 곳의 INSERT 로직을 수정해줘:
1. 장바구니 '치즈로 결제하기' 로직에서 orders INSERT 시
   order_type: 'item_purchase'로 명시
2. /payment/success 페이지에서 토스 결제 승인 후 orders INSERT 시
   order_type: 'cheese_charge'로 명시

그리고 다음 두 화면의 표기를 수정해줘:

[app/admin/page.tsx - 관리자 대시보드]
- '이번달 매출', '누적 매출' 집계 쿼리를 order_type = 'cheese_charge'
  조건으로 변경해줘 (실제 현금 매출만 집계되도록).
  기존 total_price >= 1000 조건은 제거하고 order_type 기준으로 교체.
- 최근 주문 목록에 뱃지를 추가해서 item_purchase는 회색 '아이템 구매',
  cheese_charge는 포인트 컬러(--color-pet-point)의 '치즈 충전' 뱃지로
  시각적으로 구분해줘.

[app/admin/orders/page.tsx - 관리자 주문/매출 내역]
- 테이블에 '거래유형' 컬럼을 추가해서 위와 동일한 뱃지로 표시해줘.
- 기간/상태 필터 옆에 거래유형 필터(전체/치즈충전/아이템구매)도 추가해줘.

⚠️ 추가: CSV 다운로드 시 한글 깨짐 방지 (BOM 처리)

app/admin/orders/page.tsx에 'CSV로 내보내기' 버튼을 추가해줘.
- 현재 필터링된 주문 목록을 CSV로 생성한다.
- CSV 컬럼: 주문일시, 주문자명, 이메일, 거래유형, 총 아이템 수, 총 치즈/금액, 상태
- ⚠️ 중요: CSV 문자열 맨 앞에 UTF-8 BOM(\ufeff)을 반드시 붙여줘.
  BOM 없이 생성하면 엑셀(Windows)에서 한글이 깨져서 표시되는 문제가
  실제로 발생했었다.
  예: const csvContent = '\ufeff' + headerRow + '\n' + dataRows.join('\n');
- Blob 생성 시 type: 'text/csv;charset=utf-8;'로 지정하고
  파일명은 'petlink_orders_YYYYMMDD.csv' 형태로 다운로드되게 해줘.
```

---

### ⚠️ (추가) 관리자 — 아이템 관리 페이지 구현

> 관리자 사이드바 메뉴에 "아이템관리"가 있었으나 원본 문서에는 실제 구현 프롬프트가 누락되어 있었다.
> 대시보드에서 "Failed to fetch" 에러가 발생한 원인도 이 페이지/테이블이 비어있었기 때문이었다.

프롬프트:

```
app/admin/items/page.tsx를 만들어줘.

상단:
- 아이템명 검색창
- 카테고리 필터 드롭다운 (전체 / pet / food / apparel — items.category 값과
  정확히 일치하는 값으로 옵션을 구성할 것. 한글 표기는 라벨에서만 사용하고
  실제 value는 DB 저장값과 동일하게 맞출 것)

테이블 컬럼: ID | 아이템(이모지+이름+설명) | 카테고리 | 가격 | 재고 | 판매량 | 관리(수정/삭제)

items 테이블에서 전체 목록을 불러와 표시하고,
각 행의 '수정' 버튼 클릭 시 ItemModal.tsx 모달을 띄워줘.

ItemModal.tsx 구성:
- 아이템 ID (읽기 전용)
- 이모지/에셋 경로 입력
- 아이템명 입력
- 카테고리 드롭다운 (DB 저장값과 동일한 value 사용)
- 가격(치즈) 입력
- 효과치(선택) 입력
- 재고(-1=무제한) 입력
- [취소] [저장하기] 버튼

저장 시 동작:
- PATCH 방식으로 items 테이블 UPDATE (id 기준)
- 보내는 필드명이 items 테이블 실제 컬럼명과 정확히 일치하는지 확인할 것
  (불일치 시 Supabase REST API에서 400 Bad Request 발생)

⚠️ 중요 — Controlled Input 버그 방지:
모달을 열어 기존 데이터를 폼에 채울 때(setFormData(initialData)) DB에서
price, effect_value, stock 같은 숫자 필드가 null로 내려올 수 있다.
이 경우 input의 value prop이 undefined가 되어 controlled → uncontrolled로
전환되며 React 경고와 함께 입력이 깨지는 버그가 발생한다.
반드시 nullish coalescing(??)으로 기본값을 채워서 폼 상태를 초기화할 것:

setFormData({
  ...initialData,
  price: initialData.price ?? 0,
  effect_value: initialData.effect_value ?? 0,
  stock: initialData.stock ?? -1,
  name: initialData.name ?? '',
  description: initialData.description ?? '',
  category: initialData.category ?? '',
});

'삭제' 버튼: 확인 모달 후 items 테이블에서 DELETE
'+ 새 아이템 추가' 버튼: 빈 폼으로 ItemModal을 열어 INSERT
```

---

### ⚠️ (추가) 관리자 — 주문/매출 내역 페이지 구현

> 관리자 사이드바 메뉴에 "주문내역"이 있었으나 실제 구현 프롬프트가 누락되어 있었고,
> 실제 개발 중 "결제 및 매출 내역 조회가 안 뜨는" 문제(400 에러)를 해결하는 과정에서
> 정확한 요구사항이 도출되었다.

프롬프트:

```
app/admin/orders/page.tsx를 만들어줘.

orders 테이블 전체를 ordered_at 기준 최신순으로 불러오되,
profiles 테이블과 중첩 select(JOIN)해서 주문자의 display_name, email도
함께 표시해줘.

예: supabase.from('orders').select('*, profiles(display_name, email)').order('ordered_at', { ascending: false })

⚠️ 참고: 이 JOIN 쿼리가 동작하려면 Supabase 스키마에
orders.user_id → profiles.id 외래 키 제약조건이 먼저 선언되어 있어야 한다.
(스키마 구성 단계의 fk_orders_profiles 참고. 없으면 PostgREST가 관계를
 인식하지 못해 400 Bad Request를 반환한다.)

테이블 컬럼: 주문일시 | 주문자(이름/이메일) | 총 아이템 수 | 총 결제 치즈 | 상태 | 결제수단

상단에 기간 필터(오늘/이번주/이번달/전체)와 검색(주문자 이메일) 추가.
하단에 페이지네이션(20건씩) 추가.

행 클릭 시 order_items를 함께 불러와 상세 내역(품목/수량/가격)을 펼쳐 보여줘.

관리자 디자인 컨셉(배경 #fdf6e3, 카드 흰색, 텍스트 #4a2e1b) 유지.
```

---

### 주문내역 페이지 구성 (일반 사용자용)

프롬프트:

```
app/orders/page.tsx를 만들어줘.
로그인하지 않은 상태로 접근하면 /login으로 redirect해.

orders 테이블과 order_items를 join해서 로그인한 사용자의 주문 목록을 최신순으로 나열해.

각 주문 카드:
- 주문 일시 (ordered_at)
- 주문 번호 (id 앞 8자리)
- 상태 뱃지 ('완료')
- 주문 항목 목록 (이름, 가격, 수량)
- 하단 요약: 총 N개 | 총 치즈 M개

주문이 없을 때: "아직 주문 내역이 없습니다" 메시지 + '상점으로' 버튼
메인 페이지 디자인 컨셉 유지.
```

---

### Electron 앱 구성

electron/main.js 파일을 만들고:

```javascript
// 창 설정
width: 전체 화면, height: 전체 화면
transparent: true
frame: false
alwaysOnTop: true
skipTaskbar: true
setIgnoreMouseEvents(true, { forward: true })  // 기본 클릭 통과
```

> ⚠️ 추가 설명: 이 옵션이 정확히 어떤 역할을 하는지 명시
> - transparent: true + frame: false로 만든 투명 전체화면 창은 기본적으로
>   화면 전체의 마우스 이벤트를 모두 가로채 버린다. 이 상태에서는
>   펫이 없는 빈 영역을 클릭해도 바탕화면 아이콘이나 다른 창을 클릭할 수
>   없게 되어, 사실상 PC 전체가 먹통이 되는 치명적인 문제가 있었다.
> - setIgnoreMouseEvents(true, { forward: true })를 설정하면 기본적으로
>   마우스 클릭이 Electron 창을 "투과"해서 바탕화면이나 다른 창에 그대로
>   전달된다({ forward: true } 옵션이 이 투과 동작에 필수).
> - 단, 펫 위에 마우스를 올렸을 때는 펫과 상호작용(클릭, 드래그, 우클릭
>   인벤토리 등)이 가능해야 하므로, 렌더러 프로세스(React) 쪽에서
>   펫 영역에 마우스가 들어오고 나갈 때마다 동적으로 전환해야 한다:
>   - 펫 위에 마우스 진입(onMouseEnter) →
>     electronAPI.setIgnoreMouseEvents(false) 호출 → 이 영역만 클릭 가능
>   - 펫에서 마우스 이탈(onMouseLeave) →
>     electronAPI.setIgnoreMouseEvents(true) 호출 → 다시 클릭 투과 상태로
> - 이 토글 로직(setIgnoreMouseEvents(false/true) 호출)이 CustomPet.tsx의
>   마우스 호버 핸들러에 반드시 연결되어 있어야 하며, 만약 빠지면
>   '펫과는 상호작용이 안 되거나' 혹은 '펫이 없는 영역도 클릭이 막히는'
>   두 가지 회귀 버그 중 하나가 재발할 수 있으므로 검증 순서에도
>   반드시 포함시킬 것.

```javascript
loadURL('http://localhost:3000/desktop')

// IPC 핸들러
set-ignore-mouse-events: mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
save-pet-data: 홈/.petlink/pets/[petId]_data.json 저장
load-pet-data: 위 파일 읽기, 없으면 기본값 반환
load-character: character.petlink 파일 읽기
show-context-menu: 우클릭 컨텍스트 메뉴 표시
```

electron/preload.js:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  savePetData: (petId, data) => ipcRenderer.invoke('save-pet-data', petId, data),
  loadPetData: (petId) => ipcRenderer.invoke('load-pet-data', petId),
  loadPetlinkFile: () => ipcRenderer.invoke('load-character'),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
});
```

---

### 검증 순서

1. `npm run dev` 후 `/` 접속 → 입장 스플래시 화면(벨소리 + 펫샵 일러스트) 확인 → "입장하기" 클릭 → 메인 상점 페이지 확인
2. 구글 로그인 → profiles 테이블에 치즈 5개로 row 생성 확인
3. 펫 카드 '장바구니 담기' → 장바구니 뱃지 카운트 확인
4. `/cart` 접속 → 치즈 결제 → orders, order_items, user_inventory 저장 확인 + items.sales 증가 확인
5. `/charge` 접속 → 토스페이먼츠 테스트 결제 → 치즈 잔액 증가 확인
6. `/customize` 접속 → 사람 탭 정상 동작 확인 → 고양이 탭 → 털 색상/눈 모양/악세서리 변경 → 3D 모델 즉시 반영 확인 → 크기 슬라이더로 키워도 머리 잘림/이름표 비율 깨짐 없는지 확인
7. 메인 페이지에서 캐릭터 우클릭 → 인벤토리 팝업 표시 확인 → 간식을 드래그해서 캐릭터에 드롭 → 먹는 애니메이션 + 수량 차감 확인 → 마우스를 움직이며 캐릭터가 고개를 따라오는지(시선 추적) 확인
8. `/my-pets` 접속 → 'PC 적용하기' → ZIP 다운로드 확인 (character.petlink 포함 여부 확인)
9. Electron 앱 실행 → 데스크탑에 펫 표시 → 좌우 이동 시 방향 전환 확인 → 데스크탑 펫 모드에서도 우클릭 인벤토리/시선 추적이 동일하게 동작하는지 확인 (메인 페이지에서만 되고 데스크탑에서 안 되는 회귀가 없는지 확인)
10. 펫 클릭 → 말풍선 표시 확인
11. 관리자 계정으로 `/admin` 접속 → 대시보드 집계 카드 확인
12. `/admin/items` 접속 → 아이템 목록/검색/카테고리 필터 확인 → 아이템 수정 모달 열어서 카테고리가 올바르게 선택되어 있는지(첫 항목으로 잘못 초기화되지 않는지) 확인 → 저장 시 400 에러 없이 정상 반영되는지 확인
13. `/admin/orders` 접속 → 주문 목록에 주문자 이름/이메일이 정상적으로 JOIN되어 표시되는지(400 에러 없는지) 확인
14. 'PC 적용하기'로 받은 zip 파일의 압축을 풀어서 .env, .env.local, service-role, secret, .pem, .key 등의 파일이 단 하나도 포함되어 있지 않은지 직접 확인
15. `/admin` 대시보드의 매출 카드가 토스페이먼츠 치즈 충전 건만 집계하는지(아이템 구매 건은 제외되는지) 확인, `/admin/orders`에서 거래유형 뱃지(치즈충전/아이템구매)가 올바르게 구분 표시되는지 확인, CSV로 내보내기 한 파일을 엑셀로 열어 한글이 깨지지 않는지 확인
16. 로그아웃 후 재로그인을 반복하며 치즈 잔액이 꼬이거나 초기화되지 않는지, 특히 충전 직후 기존 잔액이 사라지지 않는지 확인
17. `/my-pets`에서 아이템 여러 개를 연속으로 빠르게 가방에 넣었다 뺐다 하면서 화면이 버벅이지 않는지, '저장' 버튼을 누르기 전까지는 DB가 변경되지 않는지(네트워크 탭으로 확인), 저장 후에만 한 번에 반영되는지 확인
18. Electron 앱 실행 후 펫이 없는 빈 화면 영역을 클릭해 바탕화면 아이콘/다른 창이 정상적으로 클릭되는지, 반대로 펫 위에서는 클릭/드래그/우클릭이 막힘 없이 동작하는지 확인