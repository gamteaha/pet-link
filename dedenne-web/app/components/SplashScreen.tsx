"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [bellAudio, setBellAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/daviddumaisaudio-store-entrance-bell-188054.mp3");
    audio.volume = 0.4;
    audio.load();
    setBellAudio(audio);
  }, []);

  const handleEnter = () => {
    // Play preloaded bell sound
    if (bellAudio) {
      bellAudio.play().catch((err) => console.warn("Audio play failed", err));
    }

    setIsExiting(true);
    
    // Hide after animation (0.5s)
    setTimeout(() => {
      setShow(false);
    }, 500);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-[#C8E8F0] text-[#3D2B1F] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Paw Print Drop Animation */}
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-6xl text-[#E8A87C] opacity-80 mb-6"
          >
            🐾
          </motion.div>
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Pet Shop SVG Illustration */}
            <svg width="280" height="260" viewBox="0 0 280 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl mb-4">
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
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-center text-[#3D2B1F]">
              Pet-Link Shop
            </h1>
            <p className="text-lg md:text-xl text-[#8B6F5E] mb-10 text-center max-w-md font-bold">
              당신의 데스크탑에 온기를 채워줄<br/>새로운 가족을 만나보세요.
            </p>
          </motion.div>
            
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <button
              onClick={handleEnter}
              className="px-10 py-4 bg-[#E8A87C] hover:bg-[#d59868] text-white rounded-full font-black text-2xl shadow-[0_4px_16px_rgba(232,168,124,0.4)] hover:shadow-[0_8px_24px_rgba(232,168,124,0.6)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              🔔 입장하기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
