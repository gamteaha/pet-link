"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomPetBuilder() {
  const [images, setImages] = useState({
    idle: "",
    walk1: "",
    walk2: "",
  });

  const handleImageUpload = (slot: keyof typeof images, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setImages((prev) => ({ ...prev, [slot]: url }));
    }
  };

  const handleDrop = (slot: keyof typeof images, e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      setImages((prev) => ({ ...prev, [slot]: url }));
    }
  };

  const preventDefault = (e: React.DragEvent<HTMLElement>) => e.preventDefault();

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center py-24 font-sans text-gray-800">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">나만의 펫 커스터마이징</h1>
          <p className="text-lg text-gray-500 font-medium">당신만의 캐릭터 이미지를 업로드하여 화면 속 인터랙티브 펫을 만들어보세요.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {(['idle', 'walk1', 'walk2'] as const).map((slot) => (
            <div key={slot} className="flex flex-col items-center">
              <div className="bg-gray-50 px-5 py-2 rounded-full mb-5 border border-gray-100">
                <span className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                  {slot}.png
                </span>
              </div>
              <label 
                onDragOver={preventDefault}
                onDrop={(e) => handleDrop(slot, e)}
                className="w-full aspect-square border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-inner"
              >
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/gif" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(slot, e)} 
                />
                {images[slot] ? (
                  <motion.img 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={images[slot]} 
                    alt={slot} 
                    className="w-full h-full object-contain p-8" 
                  />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-500">이미지 업로드</span>
                    <span className="text-xs text-gray-400 mt-1">또는 드래그 앤 드롭</span>
                  </div>
                )}
                {images[slot] && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-gray-800 font-bold px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200">변경하기</span>
                  </div>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>

      <PreviewPet images={images} />
    </div>
  );
}

function PreviewPet({ images }: { images: { idle: string; walk1: string; walk2: string } }) {
  const [isMounted, setIsMounted] = useState(false);
  const [petState, setPetState] = useState<"idle" | "walk" | "run">("walk");
  const [direction, setDirection] = useState<1 | -1>(-1);
  const [position, setPosition] = useState(0);
  const [frame, setFrame] = useState<1 | 2>(1);

  useEffect(() => {
    setIsMounted(true);
    setPosition(window.innerWidth - 200);
  }, []);

  // 걷기 애니메이션 프레임 (walk1 <-> walk2)
  useEffect(() => {
    if (!isMounted) return;
    if (petState === "walk" || petState === "run") {
      const interval = setInterval(() => {
        setFrame(f => f === 1 ? 2 : 1);
      }, petState === "run" ? 80 : 200); // 뛸 때는 더 빠르게
      return () => clearInterval(interval);
    } else {
      setFrame(1);
    }
  }, [petState, isMounted]);

  // 이동 로직
  useEffect(() => {
    if (!isMounted) return;
    let animationFrameId: number;
    let lastTime = performance.now();

    const updatePosition = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setPosition(prev => {
        let newX = prev;
        let newDir = direction;

        if (petState === "walk") {
          const speed = 0.15 * deltaTime; // 걷기 속도
          newX += newDir * speed;
          
          if (newX < 50) newDir = 1;
          if (newX > window.innerWidth - 150) newDir = -1;
        } else if (petState === "run") {
          const speed = 0.7 * deltaTime; // 뛰기 속도
          newX += newDir * speed;
        }

        if (newDir !== direction) {
          setDirection(newDir);
        }

        return newX;
      });
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    if (petState === "walk" || petState === "run") {
      animationFrameId = requestAnimationFrame(updatePosition);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [petState, direction, isMounted]);

  // 도망간 후 다시 돌아오기
  useEffect(() => {
    if (petState === "run") {
      const timer = setTimeout(() => {
        setPetState("walk");
        // 돌아올 때는 반대 방향에서 오도록 설정
        setDirection(d => -d as 1 | -1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [petState]);

  const handleClick = () => {
    if (petState !== "run") {
      setPetState("run");
    }
  };

  const getCurrentImage = () => {
    if (petState === "idle") return images.idle || "/assets/dedenne/basic.png";
    
    const walkImg = frame === 1 ? images.walk1 : images.walk2;
    // 사용자가 업로드한 이미지가 우선, 없으면 idle, 그것도 없으면 기본 데덴네
    if (walkImg) return walkImg;
    if (images.idle) return images.idle;
    return frame === 1 ? "/assets/dedenne/run-right/return-left-1.png" : "/assets/dedenne/run-right/honest-jump-6.png"; 
  };

  if (!isMounted) return null;

  const displayImage = getCurrentImage();

  return (
    <div 
      className="fixed bottom-12 z-[9999] pointer-events-none"
      style={{ transform: `translateX(${position}px)` }}
    >
      <motion.div
        className="pointer-events-auto cursor-pointer relative group"
        onClick={handleClick}
        animate={{ scaleX: direction }}
        transition={{ duration: 0 }} 
        whileHover={{ scaleX: direction * 1.05, scaleY: 1.05 }}
      >
        <AnimatePresence mode="wait">
          <motion.img 
            key={displayImage}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.8 }}
            transition={{ duration: 0.1 }}
            src={displayImage} 
            alt="Preview Pet" 
            draggable={false}
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
            style={{ WebkitUserDrag: "none" } as React.CSSProperties}
          />
        </AnimatePresence>
        
        {/* 클릭 시 도망간다는 힌트 말풍선 */}
        <div 
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100"
          style={{ transform: `translateX(-50%) scaleX(${direction})` }}
        >
          클릭해서 도망가게 하기!
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-gray-100" />
        </div>
      </motion.div>
    </div>
  );
}
