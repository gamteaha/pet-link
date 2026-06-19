"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useCheese } from "../../../context/CheeseContext";
import { createClient } from "../../../utils/supabase/client";
import Character3D from "../../components/Character3D";
import DedennePet from "../../components/DedennePet";
import Universal3DViewer from "../../components/characters/Universal3DViewer";
import CustomPet from "../../components/CustomPet";

const SHOP_ITEMS: Record<string, any> = {
  dedenne: {
    id: "dedenne",
    name: "데덴네 (Dedenne)",
    description: "전기를 다루는 귀여운 쥐 포켓몬! 화면 곳곳을 누비며 당신을 즐겁게 해줄 거예요. 마우스로 드래그해서 끌어 올리면 파닥파닥거리는 귀여운 모션도 포함되어 있습니다.",
    price: 5,
    type: "2d-sprite",
    motions: [
      { name: "대기 (Idle)", sprites: ["/assets/dedenne/basic.png"] },
      { name: "걷기 (Walk)", sprites: [
        "/assets/dedenne/run-left/return-right-1.png",
        "/assets/dedenne/run-left/leftside-2.png",
        "/assets/dedenne/run-left/sit-down-2.1.png",
        "/assets/dedenne/run-left/tail-return-3.png",
        "/assets/dedenne/run-left/tail-return-and-jump-4.png"
      ]},
      { name: "파닥파닥 (Lifted)", sprites: [
        "/assets/dedenne/swing/lifted.png",
        "/assets/dedenne/swing/swing-left.png",
        "/assets/dedenne/swing/swing-right.png"
      ]},
      { name: "먹기 (Eating)", sprites: [
        "/assets/dedenne/basic.png",
        "/assets/dedenne/mouth-closed/mouth-closed.png"
      ]},
      { name: "쓰다듬기 (Pat-pat)", sprites: [
        "/assets/dedenne/pat-pat/wink-1.png",
        "/assets/dedenne/pat-pat/wink-midle-3.png",
        "/assets/dedenne/pat-pat/wink-left-tilt.png",
        "/assets/dedenne/pat-pat/wink-right-tilt.png"
      ]}
    ]
  },
  raccoon: {
    id: "raccoon",
    name: "너구리 (Raccoon Dog)",
    description: "장난꾸러기 숲속 너구리입니다. 화면 가장자리에서 나타나 쓰레기통을 뒤지는 걸 좋아해요.",
    price: 50,
    type: "3d",
    motions: [ { name: "대기 (Idle)" }, { name: "걷기 (Walk)" } ]
  },
  pig: {
    id: "pig",
    name: "돼지 (Pig)",
    description: "항상 배가 고픈 핑크빛 돼지입니다. 먹을 것을 주면 좋아해요.",
    price: 30,
    type: "3d",
    motions: [ { name: "대기 (Idle)" }, { name: "걷기 (Walk)" } ]
  },
  chick: {
    id: "chick",
    name: "병아리 (Chick)",
    description: "삐약삐약 소리를 내며 종종걸음으로 따라오는 귀여운 병아리입니다.",
    price: 20,
    type: "3d",
    motions: [ { name: "대기 (Idle)" }, { name: "뛰기 (Run)" } ]
  },
  chicken: {
    id: "chicken",
    name: "닭 (Chicken)",
    description: "아침마다 꼬끼오 하고 울어줄지도 모르는 멋진 닭입니다.",
    price: 40,
    type: "3d",
    motions: [ { name: "대기 (Idle)" }, { name: "뛰기 (Run)" } ]
  },
  horse: {
    id: "horse",
    name: "말 (Horse)",
    description: "초원을 달리는 멋진 갈기를 가진 말입니다. 당근을 주면 기뻐해요.",
    price: 80,
    type: "3d",
    motions: [ { name: "대기 (Idle)" }, { name: "뛰기 (Run)" } ]
  },
  'blue-tang': {
    id: "blue-tang",
    name: "파란돔 (Blue Tang)",
    description: "화면을 헤엄쳐 다니는 푸른 바다의 파란돔입니다.",
    price: 120,
    type: "3d",
    motions: [ { name: "헤엄 (Swim)" } ]
  }
};

export default function ShopItemClient({ id }: { id: string }) {
  const item = SHOP_ITEMS[id];
  const { user } = useAuth();
  const { cheeseBalance, spendCheese } = useCheese();
  const router = useRouter();
  const supabase = createClient();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [activeMotion, setActiveMotion] = useState(0);
  const [spriteFrame, setSpriteFrame] = useState(0);
  const [showCartModal, setShowCartModal] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (!item || item.type !== "2d-sprite") return;
    const sprites = item.motions[activeMotion]?.sprites;
    if (!sprites || sprites.length <= 1) {
      setSpriteFrame(0);
      return;
    }
    const interval = setInterval(() => {
      setSpriteFrame(prev => (prev + 1) % sprites.length);
    }, 250);
    return () => clearInterval(interval);
  }, [item?.type, activeMotion]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem('petLink_cart') || '[]');
    const alreadyInCart = existingCart.some((i: any) => i.shopId === item.id);
    if (alreadyInCart) {
      showToast("이미 장바구니에 담겨 있어요!");
      return;
    }
    const config = { id: Date.now(), name: item.name, isShopItem: true, shopId: item.id, price: item.price };
    existingCart.push(config);
    localStorage.setItem('petLink_cart', JSON.stringify(existingCart));
    setShowCartModal(true);
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (cheeseBalance < item.price) {
      showToast("치즈가 부족합니다. 충전 페이지로 이동합니다.");
      setTimeout(() => router.push('/charge'), 1500);
      return;
    }
    setIsBuying(true);
    try {
      const success = await spendCheese(item.price);
      if (!success) {
        throw new Error("치즈 차감 실패");
      }
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ user_id: user.id, total_items: 1, total_price: item.price, status: 'completed' })
        .select().single();

      if (orderError || !order) throw new Error();

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        item_id: item.id,
        item_name: item.name,
        price: item.price
      });

      if (itemError) {
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error();
      }

      const newPetConfig = {
        id: item.id,
        name: item.name,
        shopId: item.id,
        isShopItem: true,
        emoji: item.emoji,
        price: item.price,
        inventory: {}
      };

      const { data: insertedPet, error: insertPetError } = await supabase
        .from('user_pets')
        .insert({
          user_id: user.id,
          config: newPetConfig
        })
        .select()
        .single();

      if (insertPetError) {
        console.error("Failed to insert pet to db:", insertPetError);
      }

      // 내 펫 목록에 추가 (계정별 분리)
      const myPetsKey = `petLink_myPets_${user.id}`;
      const savedPetsStr = localStorage.getItem(myPetsKey);
      let savedPets: any[] = savedPetsStr ? JSON.parse(savedPetsStr) : [];
      if (!savedPets.find(p => p.id === item.id)) {
        savedPets.push(newPetConfig);
        localStorage.setItem(myPetsKey, JSON.stringify(savedPets));
      }

      showToast("주문이 완료되었습니다! 🎉");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("startWebTutorial"));
      }
      setTimeout(() => router.push('/orders'), 1500);
    } catch {
      showToast("결제에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsBuying(false);
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans">
        <h1 className="text-4xl font-black text-[#4a2e1b] mb-4">해당 아이템을 찾을 수 없습니다.</h1>
        <Link href="/" className="px-6 py-3 bg-[#e8dac1] hover:bg-[#d4c5b2] text-[#4a2e1b] font-bold rounded-xl transition-colors">
          상점 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen font-sans relative text-[var(--color-pet-text)] py-12 px-6 flex flex-col items-center">
      <div className="max-w-5xl w-full flex justify-between items-center mb-10 border-b-4 border-[var(--color-pet-point)] pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight">펫 상세 정보 🔍</h1>
        <Link href="/" className="px-6 py-3 bg-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.8)] text-[var(--color-pet-text)] font-bold rounded-xl transition-colors border border-[rgba(255,255,255,0.6)]">
          상점으로 돌아가기
        </Link>
      </div>

      <div className="max-w-5xl w-full flex flex-col md:flex-row gap-12">
        
        {/* Preview Panel */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <div className="pet-case-card p-0 flex flex-col aspect-square relative shadow-lg">
            <div className="flex-1 pet-display-area border-0 rounded-none relative flex items-center justify-center overflow-hidden z-10">
            
            {item.type === "2d-sprite" && (
              <img 
                src={item.motions[activeMotion]?.sprites?.[spriteFrame] || item.motions[activeMotion]?.sprites?.[0]} 
                alt="preview" 
                className="w-64 h-64 object-contain" 
              />
            )}
            
            {item.type === "emoji" && (
              <span className={`text-9xl ${activeMotion === 1 ? 'animate-bounce' : ''}`}>
                {item.emoji}
              </span>
            )}
            
            {item.type === "3d" && (
              <div className="absolute inset-0 w-full h-full">
                {item.id === 'human' ? (
                  <Character3D 
                    hairColorHSL="hsl(30, 70%, 50%)"
                    skinColorHex="#ffdfc4"
                    outfitColorHex="#4287f5"
                    backpackColorHex="#ff9999"
                    frontHairIndex={2}
                    backHairIndex={1}
                    bodyType={1}
                    eyeType={1}
                    mouthType={2}
                    blushType={2}
                    outfitStyle={1}
                    hatType={1}
                    isWalking={activeMotion === 1}
                    hideControls={true}
                  />
                ) : (
                  <Universal3DViewer 
                    species={item.id}
                    animationState={item.motions[activeMotion]?.name.includes("걷기") ? "walk" : item.motions[activeMotion]?.name.includes("뛰기") ? "run" : item.motions[activeMotion]?.name.includes("헤엄") ? "walk" : "idle"}
                    characterSize={100}
                    trackMouse={true}
                  />
                )}
              </div>
            )}
            
            </div>
            <div className="pet-case-floor"></div>
          </div>
          
          {/* Motion Selector */}
          <div className="flex gap-4 justify-center">
            {item.motions.map((motion: any, index: number) => (
              <button 
                key={index}
                onClick={() => setActiveMotion(index)}
                className={`px-4 py-3 rounded-2xl font-bold text-lg border-[2px] border-[rgba(255,255,255,0.6)] transition-transform hover:scale-105 ${activeMotion === index ? 'bg-[var(--color-pet-point)] text-white' : 'glass-card text-[var(--color-pet-text)]'}`}
              >
                {motion.name}
              </button>
            ))}
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-full md:w-1/2 flex flex-col glass-card p-10">
          <h2 className="text-4xl font-black mb-4">{item.name}</h2>
          <div className="text-2xl font-black text-[var(--color-pet-point)] mb-8">{item.price === 0 ? "무료" : `🧀 ${item.price.toLocaleString()} 개`}</div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button 
              onClick={() => setIsPreviewing(!isPreviewing)}
              className={`flex-1 py-4 border-[rgba(255,255,255,0.6)] border-[2px] rounded-2xl font-black text-xl shadow-sm transition-transform hover:scale-105 flex items-center justify-center gap-3 ${isPreviewing ? "bg-[var(--color-pet-point)] text-white" : "bg-[rgba(255,255,255,0.6)] text-[var(--color-pet-text)] hover:bg-[rgba(255,255,255,0.8)]"}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {isPreviewing ? "미리보기 종료" : "👀 화면 미리보기"}
            </button>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3 border-b-2 border-[rgba(255,255,255,0.6)] pb-2">설명</h3>
            <p className="text-lg text-[var(--color-pet-subtext)] leading-relaxed font-medium">
              {item.description}
            </p>
          </div>

          {item.id === "human" && (
            <div className="mb-6 p-4 bg-[rgba(255,255,255,0.4)] rounded-2xl border border-[rgba(255,255,255,0.6)]">
              <p className="font-bold text-[var(--color-pet-point)]">💡 커스텀 팁!</p>
              <p className="text-sm text-[var(--color-pet-subtext)] mt-1">이 캐릭터는 메인 화면의 [나만의 캐릭터 꾸미기] 버튼을 통해 얼굴, 헤어, 옷을 마음대로 변경할 수 있습니다.</p>
            </div>
          )}

          <button 
            onClick={handleAddToCart}
            className="w-full py-4 bg-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.8)] border-[rgba(255,255,255,0.6)] border-[2px] text-[var(--color-pet-text)] rounded-2xl font-black text-xl shadow-sm transition-transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            장바구니 담기
          </button>

          <button 
            onClick={handleBuyNow}
            disabled={isBuying}
            className="w-full py-4 bg-[var(--color-pet-point)] hover:bg-[#d59868] disabled:bg-gray-400 border-[rgba(255,255,255,0.6)] border-[2px] text-white rounded-2xl font-black text-xl shadow-sm transition-transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            {isBuying ? (
              <span className="animate-bounce inline-block text-2xl mr-2">🐾</span>
            ) : "🧀 치즈로 구매"}
          </button>
        </div>

      </div>
    </div>

      {toastMsg && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-[var(--color-pet-point)] text-white font-bold rounded-2xl shadow-xl z-50 animate-bounce">
          {toastMsg}
        </div>
      )}
      
      {/* 화면 미리보기용 CustomPet */}
      {isPreviewing && (
        <CustomPet previewConfig={{ type: 'animal', species: item.id }} />
      )}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="glass-card !bg-white p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center animate-fade-in text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-2xl font-black mb-2 text-[var(--color-pet-text)]">장바구니에 담겼습니다!</h3>
            <p className="text-[var(--color-pet-subtext)] mb-8 font-medium">장바구니로 이동하여 결제를 진행하시겠습니까?</p>
            
            <div className="flex flex-col gap-3 w-full">
              <Link 
                href="/cart"
                className="w-full py-4 bg-[var(--color-pet-point)] hover:bg-[#d59868] text-white rounded-xl font-bold text-lg shadow-sm transition-transform hover:scale-105 flex justify-center items-center"
              >
                장바구니 바로가기
              </Link>
              <button 
                onClick={() => setShowCartModal(false)}
                className="w-full py-4 bg-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.8)] text-[var(--color-pet-text)] border border-[rgba(255,255,255,0.6)] rounded-xl font-bold text-lg shadow-sm transition-transform hover:scale-105"
              >
                계속 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
