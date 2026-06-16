"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useCart, ITEM_CATALOG } from "../context/CartContext";
import { useCheese } from "../context/CheeseContext";
import { useState } from "react";
import { motion } from "framer-motion";
import ItemShop from "./components/ItemShop";
import Universal3DViewer from "./components/characters/Universal3DViewer";

export default function Home() {
  const { user, signOut } = useAuth();
  const { addToCart, removeFromCart, isInCart, cartCount } = useCart();
  const { cheeseBalance } = useCheese();
  const [showAuthPopover, setShowAuthPopover] = useState(false);

  return (
    <div className="flex flex-col min-h-screen font-sans relative text-[var(--color-pet-text)]">
      {/* Top Right Navigation */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        {/* Charge Button */}
        <Link
          href={user ? "/charge" : "/login"}
          className="relative px-6 py-3 bg-[rgba(255,255,255,0.6)] border-2 border-[var(--color-pet-point)] text-[var(--color-pet-point)] rounded-full hover:bg-[var(--color-pet-point)] hover:text-white font-bold text-lg flex items-center justify-center h-[56px] transition-colors"
        >
          🧀 치즈 충전
        </Link>
        {/* Cart Button */}
        <Link
          href="/cart"
          className="relative p-3 bg-white border-2 border-[#d8e2b8] rounded-full hover:bg-[#f8eedb] text-2xl w-[56px] h-[56px] flex items-center justify-center"
          title="장바구니"
        >
          🛒
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[var(--color-pet-point)] text-white text-sm rounded-full px-2 py-0.5 min-w-[1.5rem] text-center font-bold">
              {cartCount}
            </span>
          )}
        </Link>

        {/* Auth / Profile */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowAuthPopover(!showAuthPopover)}
              className="flex items-center gap-2 bg-white border-2 border-[#d8e2b8] rounded-full p-1.5 hover:bg-[#f8eedb] h-[56px] w-[56px] justify-center"
            >
              <img
                src={user.user_metadata?.avatar_url || "/default-avatar.png"}
                alt="avatar"
                className="w-10 h-10 rounded-full"
              />
            </button>
            {showAuthPopover && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md py-2 z-20 border-2 border-[#e8dac1]">
                <Link
                  href="/my-pets"
                  className="block w-full text-left px-4 py-2 hover:bg-[#f8eedb] font-bold text-[#4a2e1b] border-b border-[#e8dac1]"
                >
                  🐾 나의 펫
                </Link>
                <Link
                  href="/orders"
                  className="block w-full text-left px-4 py-2 hover:bg-[#f8eedb] font-bold text-[#4a2e1b] border-b border-[#e8dac1]"
                >
                  📦 구매 내역
                </Link>
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 font-bold text-red-500"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative flex items-center">
            <div className="absolute right-[calc(100%+12px)] whitespace-nowrap bg-[var(--color-pet-point)] text-white text-sm font-bold px-4 py-2 rounded-xl animate-bounce shadow-md pointer-events-none">
              🎁 지금 로그인 시 치즈 5개 증정!
              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-y-[8px] border-y-transparent border-l-[8px] border-l-[var(--color-pet-point)]"></div>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-2 bg-white border-2 border-[var(--color-pet-border)] rounded-full px-6 py-3 hover:bg-[var(--color-pet-bg-hover)] font-bold text-lg h-[56px] transition-colors"
            >
              로그인
            </Link>
          </div>
        )}
      </div>

      {/* Header / Hero Section */}
      <header className="flex flex-col items-center pt-20 pb-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-4"
        >
          {/* Pet Shop SVG Illustration */}
          <svg width="200" height="180" viewBox="0 0 280 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
            {/* Pavement */}
            <rect x="20" y="240" width="240" height="20" fill="#B0BEC5" rx="4" />
            
            {/* Building base */}
            <path d="M40 80 L240 80 L240 240 L40 240 Z" fill="#FEFAE0" />
            
            {/* Roof / Top Base */}
            <path d="M30 65 L250 65 L240 80 L40 80 Z" fill="#E8A87C" />
            
            {/* Door */}
            <rect x="110" y="140" width="60" height="100" fill="#7ECECA" fillOpacity="0.4" rx="4" stroke="#7ECECA" strokeWidth="4" />
            <circle cx="125" cy="190" r="4" fill="#FEFAE0" />
            
            {/* Windows */}
            <rect x="55" y="140" width="40" height="60" fill="#7ECECA" fillOpacity="0.4" rx="4" stroke="#7ECECA" strokeWidth="4" />
            <rect x="185" y="140" width="40" height="60" fill="#7ECECA" fillOpacity="0.4" rx="4" stroke="#7ECECA" strokeWidth="4" />
            
            {/* Paw print on windows */}
            <g transform="translate(65, 160) scale(0.6)" fill="#7ECECA">
              <circle cx="10" cy="18" r="8" />
              <circle cx="2" cy="8" r="4" />
              <circle cx="10" cy="2" r="4" />
              <circle cx="18" cy="8" r="4" />
            </g>
            <g transform="translate(195, 160) scale(0.6)" fill="#7ECECA">
              <circle cx="10" cy="18" r="8" />
              <circle cx="2" cy="8" r="4" />
              <circle cx="10" cy="2" r="4" />
              <circle cx="18" cy="8" r="4" />
            </g>
            
            {/* Awning (Stripes) */}
            <path d="M 25 110 L 255 110 L 255 130 L 25 130 Z" fill="#7ECECA" />
            <path d="M 45 110 L 65 110 L 65 130 L 45 130 Z" fill="#FFFFFF" fillOpacity="0.9" />
            <path d="M 85 110 L 105 110 L 105 130 L 85 130 Z" fill="#FFFFFF" fillOpacity="0.9" />
            <path d="M 125 110 L 145 110 L 145 130 L 125 130 Z" fill="#FFFFFF" fillOpacity="0.9" />
            <path d="M 165 110 L 185 110 L 185 130 L 165 130 Z" fill="#FFFFFF" fillOpacity="0.9" />
            <path d="M 205 110 L 225 110 L 225 130 L 205 130 Z" fill="#FFFFFF" fillOpacity="0.9" />
            <path d="M 245 110 L 255 110 L 255 130 L 245 130 Z" fill="#FFFFFF" fillOpacity="0.9" />
            
            {/* Awning Scallops */}
            <circle cx="35" cy="130" r="10" fill="#7ECECA" />
            <circle cx="55" cy="130" r="10" fill="#FFFFFF" />
            <circle cx="75" cy="130" r="10" fill="#7ECECA" />
            <circle cx="95" cy="130" r="10" fill="#FFFFFF" />
            <circle cx="115" cy="130" r="10" fill="#7ECECA" />
            <circle cx="135" cy="130" r="10" fill="#FFFFFF" />
            <circle cx="155" cy="130" r="10" fill="#7ECECA" />
            <circle cx="175" cy="130" r="10" fill="#FFFFFF" />
            <circle cx="195" cy="130" r="10" fill="#7ECECA" />
            <circle cx="215" cy="130" r="10" fill="#FFFFFF" />
            <circle cx="235" cy="130" r="10" fill="#7ECECA" />
            <circle cx="250" cy="130" r="5" fill="#FFFFFF" />

            {/* Bone Sign */}
            <g transform="translate(50, 10)">
              <rect x="20" y="10" width="140" height="40" rx="10" fill="#FEFAE0" stroke="#E8A87C" strokeWidth="4" />
              <circle cx="20" cy="20" r="12" fill="#FEFAE0" stroke="#E8A87C" strokeWidth="4" />
              <circle cx="20" cy="40" r="12" fill="#FEFAE0" stroke="#E8A87C" strokeWidth="4" />
              <circle cx="160" cy="20" r="12" fill="#FEFAE0" stroke="#E8A87C" strokeWidth="4" />
              <circle cx="160" cy="40" r="12" fill="#FEFAE0" stroke="#E8A87C" strokeWidth="4" />
              {/* Overlap to hide inner strokes */}
              <rect x="18" y="13" width="144" height="34" rx="8" fill="#FEFAE0" />
              <circle cx="20" cy="20" r="9" fill="#FEFAE0" />
              <circle cx="20" cy="40" r="9" fill="#FEFAE0" />
              <circle cx="160" cy="20" r="9" fill="#FEFAE0" />
              <circle cx="160" cy="40" r="9" fill="#FEFAE0" />
              
              <text x="90" y="36" fontFamily="sans-serif" fontWeight="900" fontSize="18" textAnchor="middle" fill="#E8A87C">PET-LINK</text>
            </g>
          </svg>
        </motion.div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 z-10">
          Pet-Link Shop 🐾
        </h1>
        <p className="text-lg text-[var(--color-pet-subtext)] font-medium max-w-xl z-10">
          당신의 데스크탑에 활기를 불어넣어 줄 친구들을 만나보세요.
          원하는 펫이나 캐릭터를 입양하거나, 나만의 캐릭터를 직접 꾸밀 수도 있답니다!
        </p>
        
        <div className="flex justify-center mt-8">
          <Link
            href="/customize"
            className="w-full max-w-md px-8 py-6 bg-[var(--color-pet-point)] hover:bg-[#d59868] text-white rounded-full font-bold text-2xl text-center shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            나만의 캐릭터 꾸미기 🎨
          </Link>
        </div>
      </header>

      {/* Shop Section */}
      <main className="flex-1 px-6 pb-24 max-w-6xl mx-auto w-full z-10 relative">
        <div className="flex items-center justify-between mb-8 border-b-2 border-[rgba(120,200,230,0.4)] pb-4">
          <h2 className="text-3xl font-bold">캐릭터 상점</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 glass-card px-4 py-2 !rounded-full">
              <span className="font-bold">보유 치즈:</span>
              <span className="text-[var(--color-pet-point)] font-black">🧀 {cheeseBalance} 개</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.values(ITEM_CATALOG)
            .filter(item => !['bread', 'strawberry', 'soap', 'towel'].includes(item.id))
            .map((item, index) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.15 }} className="h-full">
                <Link href={`/shop/${item.id}`} className="pet-case-card group flex flex-col cursor-pointer h-full">
                  <div className="p-6 flex-1 flex flex-col z-10">
                    <div className="pet-display-area mb-4 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform duration-300">
                      {item.id === 'dedenne' ? (
                        <img src="/assets/dedenne/basic.png" alt="Dedenne" className="w-32 h-32 object-contain" />
                      ) : (
                        <Universal3DViewer 
                          species={item.id} 
                          animationState="idle" 
                          trackMouse={false} 
                          characterSize={130}
                          containerClassName="w-full h-48 sm:h-56" 
                        />
                      )}
                    </div>
                    <h3 className="text-2xl font-black mb-2">{item.name}</h3>
                    <p className="text-[var(--color-pet-subtext)] text-sm mb-6 flex-1">
                      {item.description}
                    </p>
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-xl font-bold text-[var(--color-pet-point)]">🧀 {item.price} 개</span>
                      <span className="text-sm font-bold text-[var(--color-pet-subtext)] group-hover:text-[var(--color-pet-point)] transition-colors">자세히 보기 →</span>
                    </div>
                  </div>
                  <div className="pet-case-floor"></div>
                </Link>
              </motion.div>
            ))}

        </div>

        <ItemShop />
      </main>
    </div>
  );
}
