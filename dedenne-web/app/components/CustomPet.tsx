"use client";

import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import Character3D, { Character3DProps } from "./Character3D";
import Universal3DViewer from "./characters/Universal3DViewer";
import DedennePet from "./DedennePet";
import InventoryWindow from "./InventoryWindow";
import CharacterWithEyes from "./CharacterWithEyes";
import BubbleOverlay from "./BubbleOverlay";

// Color mapping logic (same as customize/page.tsx)
function getSkinColorHex(value: number) {
  const r = Math.round(255 - (255 - 74) * (value / 100));
  const g = Math.round(224 - (224 - 46) * (value / 100));
  const b = Math.round(196 - (196 - 27) * (value / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function CustomPet({ previewConfig }: { previewConfig?: any }) {
  const [config, setConfig] = useState<any>(previewConfig || null);
  const [state, setState] = useState<"idle" | "walk" | "startled" | "eat" | "wash">("idle");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [isPatting, setIsPatting] = useState(false);

  const x = useMotionValue(200);
  const y = useMotionValue(200);
  const velocity = useRef({ x: 0, y: 0 });
  const windowSize = useRef({ width: 1000, height: 800 });
  const walkTimer = useRef<NodeJS.Timeout | null>(null);
  const speechTimer = useRef<NodeJS.Timeout | null>(null);
  const lastPatDate = useRef<string>("");

  const showSpeech = async (msg: string, duration = 2000) => {
    setSpeechBubble(msg);
    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeechBubble(null), duration);

    const customAnimalSupported = ['cat', 'dog'];
    const shopAnimalSupported = ['pig', 'chick', 'chicken', 'horse'];

    if (config?.type && customAnimalSupported.includes(config.type)) {
      if (config?.voice?.name && (config.voice.name.startsWith('real-') || config.voice.name.startsWith('mech-'))) {
        const soundPrefix = config.voice.name.startsWith('mech') ? 'mech' : 'real';
        const soundIndex = Math.floor(Math.random() * 3) + 1;
        const soundPath = `/sounds/${soundPrefix}-${config.type}/${soundPrefix}-${config.type}-${soundIndex}.mp3`;
        try {
          const audio = new Audio(soundPath);
          audio.play().catch(e => console.error("Animal sound play failed:", e));
        } catch (err) {
          console.error('Failed to play animal sound:', err);
        }
      }
    } else if (config?.isShopItem && config?.shopId && shopAnimalSupported.includes(config.shopId)) {
      const soundIndex = Math.floor(Math.random() * 3) + 1;
      const soundPath = `/sounds/real-${config.shopId}/real-${config.shopId}-${soundIndex}.mp3`;
      try {
        const audio = new Audio(soundPath);
        audio.play().catch(e => console.error("Shop animal sound play failed:", e));
      } catch (err) {
        console.error('Failed to play shop animal sound:', err);
      }
    } else if (config?.voice) {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: msg,
            voiceConfig: config.voice
          })
        });
        const data = await res.json();
        if (data.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
          audio.play().catch(e => console.error("Audio play failed:", e));
        }
      } catch (err) {
        console.error('Failed to play TTS:', err);
      }
    }
  };

  useEffect(() => {
    if (previewConfig) {
      setConfig(previewConfig);
    }
  }, [previewConfig]);

  // ── 초기화 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true);

    const loadConfig = async () => {
      if ((window as any).electronAPI?.loadPetlinkFile) {
        const fileConfig = await (window as any).electronAPI.loadPetlinkFile();
        if (fileConfig) {
          setConfig(fileConfig);
          return;
        }
      }
      if (previewConfig) {
        setConfig(previewConfig);
        return;
      }
      const saved = localStorage.getItem('petLink_customPet');
      if (saved) setConfig(JSON.parse(saved));
    };

    loadConfig();

    // 오늘 쓰담쓰담 날짜 초기화
    const loadPatDate = async () => {
      if ((window as any).electronAPI?.loadPetData) {
        const data = await (window as any).electronAPI.loadPetData();
        lastPatDate.current = data?.last_pat_date ?? "";
      }
    };
    loadPatDate();

    // IPC: 가방 열기/닫기 이벤트 수신
    if ((window as any).electronAPI?.onToggleBag) {
      (window as any).electronAPI.onToggleBag(() => {
        setShowBag(prev => !prev);
      });
    }
  }, []);

  // ── 물리 엔진 ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMounted) return;

    windowSize.current = { width: window.innerWidth, height: window.innerHeight };
    const handleResize = () => {
      windowSize.current = { width: window.innerWidth, height: window.innerHeight };
    };
    window.addEventListener("resize", handleResize);

    const moveInterval = setInterval(() => {
      if (isDragging) return;

      const currentX = x.get();
      const currentY = y.get();
      let vx = velocity.current.x;
      let vy = velocity.current.y;

      const floorY = windowSize.current.height - 250;

      if (currentY < floorY) {
        vy += 1.5;
        if (state !== "startled") setState("startled");
      } else {
        y.set(floorY);
        vy = 0;
        vx *= 0.75;
        if (state === "startled") setState("idle");
      }

      let nx = currentX + vx;
      if (state === "walk") {
        nx += direction * 2.5;
        const margin = 100;
        if (nx < margin) {
          setDirection(1);
          nx = margin;
        } else if (nx > windowSize.current.width - margin) {
          setDirection(-1);
          nx = windowSize.current.width - margin;
        }
      }

      x.set(nx);
      y.set(currentY + vy);
      velocity.current = { x: vx, y: vy };
    }, 1000 / 60);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(moveInterval);
    };
  }, [isDragging, state, direction]);

  // ── AI 행동 루프 ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMounted || state === "startled" || isDragging || state === "eat" || state === "wash") return;

    const act = () => {
      const actions = ["idle", "idle", "walk", "walk"];
      const nextAction = actions[Math.floor(Math.random() * actions.length)] as any;
      setState(nextAction);
      if (nextAction === "walk") {
        if (Math.random() > 0.5) setDirection(d => (d === 1 ? -1 : 1));
      }
      const nextDelay = nextAction === "walk" ? 2000 + Math.random() * 3000 : 1000 + Math.random() * 2000;
      walkTimer.current = setTimeout(act, nextDelay);
    };

    walkTimer.current = setTimeout(act, 1000);

    return () => {
      if (walkTimer.current) clearTimeout(walkTimer.current);
    };
  }, [state, isDragging, isMounted]);

  // ── 쓰담쓰담 (클릭) ────────────────────────────────────────────────────
  const handlePat = async (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 왼쪽 클릭만
    e.stopPropagation();
    if (isDragging) return;

    setIsPatting(true);
    setTimeout(() => setIsPatting(false), 600);

    const today = new Date().toISOString().slice(0, 10);
    const patMessages = ["💖 기분 좋아!", "✨ 행복해~", "🌸 히히힛!", "💕 좋아좋아!"];
    const alreadyMsg = ["😊 오늘 이미 쓰담했잖아~", "🌙 내일 또 해줘!"];

    if (lastPatDate.current === today) {
      showSpeech(alreadyMsg[Math.floor(Math.random() * alreadyMsg.length)], 2000);
      return;
    }

    // 호감도 +5
    if ((window as any).electronAPI?.loadPetData && (window as any).electronAPI?.savePetData) {
      const data = await (window as any).electronAPI.loadPetData();
      let affection = (data.affection ?? 0) + 5;
      let level = data.level ?? 1;
      if (affection >= 100) { level++; affection = 0; }

      lastPatDate.current = today;
      await (window as any).electronAPI.savePetData({
        ...data,
        affection,
        level,
        last_pat_date: today
      });
    }

    showSpeech(patMessages[Math.floor(Math.random() * patMessages.length)], 2000);
  };

  // ── 우클릭 ──────────────────────────────────────────────────────────────
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((window as any).electronAPI?.showContextMenu) {
      (window as any).electronAPI.showContextMenu();
    }
  };

  // ── 아이템 사용 콜백 ────────────────────────────────────────────────────
  const handleItemUse = (itemId: string, affectionGain: number, message: string) => {
    showSpeech(message, 2000);
    
    if (itemId === 'bread' || itemId === 'strawberry') {
      setState("eat");
    } else if (itemId === 'soap' || itemId === 'towel') {
      setState("wash");
    }

    setTimeout(() => {
      setState("idle");
    }, 2000); // 2초 애니메이션 후 대기 상태로 복귀
  };

  if (!config) return null;

  const characterProps: Character3DProps = {
    frontHairIndex: config.frontHairIndex ?? 2,
    backHairIndex: config.backHairIndex ?? 1,
    bodyType: config.bodyType,
    eyeType: config.eyeType,
    mouthType: config.mouthType,
    blushType: config.blushType,
    outfitStyle: config.outfitStyle,
    hatType: config.hatType,
    glassesType: config.glassesType ?? 1,
    glassesColorHex: config.glassesColor ?? "#1a1a1a",
    backpackType: config.backpackType ?? 2,
    characterSize: config.characterSize ?? 100,
    skinColorHex: getSkinColorHex(config.skinToneValue),
    hairColorHSL: `hsl(${config.hairColorValue * 3.6}, 70%, ${config.hairLightnessValue ?? 50}%)`,
    outfitColorHex: config.outfitColor,
    backpackColorHex: config.backpackColor,
    isWalking: state === "walk",
    isDragging: isDragging,
    isEating: state === "eat",
    isWashing: state === "wash",
    direction: direction,
    hideControls: true
  };

  return (
    <>
      <motion.div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          x,
          y,
          width: 250 * ((config.type === 'animal' ? 100 : (config.characterSize ?? 100)) / 100),
          height: 250 * ((config.type === 'animal' ? 100 : (config.characterSize ?? 100)) / 100),
          zIndex: 9999,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none"
        }}
        drag
        dragMomentum={false}
        onDragStart={() => {
          setIsDragging(true);
          setState("startled");
          showSpeech("우와!!", 1500);
        }}
        onDragEnd={(e, info) => {
          setIsDragging(false);
          velocity.current = { x: info.velocity.x * 0.01, y: info.velocity.y * 0.01 };
          if ((window as any).electronAPI) {
            (window as any).electronAPI.setIgnoreMouseEvents(true);
          }
        }}
        onMouseEnter={() => {
          if ((window as any).electronAPI) {
            (window as any).electronAPI.setIgnoreMouseEvents(false);
          }
        }}
        onMouseLeave={() => {
          if (!isDragging && (window as any).electronAPI) {
            (window as any).electronAPI.setIgnoreMouseEvents(true);
          }
        }}
        onClick={handlePat}
        onContextMenu={handleContextMenu}
        whileHover={{ scale: 1.05 }}
        animate={isPatting ? { rotate: [0, -8, 8, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {/* 말풍선 */}
        {speechBubble && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              border: '2px solid #ccc',
              borderRadius: 12,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              color: '#4a2e1b',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 10000,
              fontFamily: "'Malgun Gothic', sans-serif",
              pointerEvents: 'none',
              marginBottom: 8
            }}
          >
            {speechBubble}
            <div style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid white'
            }} />
          </div>
        )}

        <CharacterWithEyes
          className="w-full h-full relative"
          disableEyeTracking={true}
          onFeed={(itemId) => {
            // trigger custom pet's specific behavior if we have it
            if (itemId === 'bread' || itemId === 'strawberry') {
              setState("eat");
              showSpeech("냠냠! 배고파요!", 2000);
            } else if (itemId === 'soap' || itemId === 'towel') {
              setState("wash");
              showSpeech("🧼 깨끗해져요~", 2000);
            }
            setTimeout(() => setState("idle"), 2000);
          }}
        >
          <div className="w-full h-full relative pointer-events-none">
            {config?.shopId === 'dedenne' ? (
              <DedennePet />
            ) : config?.isShopItem ? (
              <Universal3DViewer 
                species={config.shopId} 
                animationState={state === 'walk' ? 'walk' : state === 'startled' ? 'startled' : 'idle'} 
                trackMouse={true} 
                characterSize={100}
                enableRotate={false}
                containerClassName="w-full h-full pointer-events-none"
              />
            ) : config?.type === 'animal' ? (
              <Universal3DViewer
                species={config.species || 'cat'}
                furColor={config.furColor}
                animationState={state === 'walk' ? 'walk' : state === 'startled' ? 'startled' : 'idle'}
                trackMouse={true}
                characterSize={100}
                enableRotate={false}
                containerClassName="w-full h-full pointer-events-none"
              />
            ) : (
              <Character3D {...characterProps} />
            )}

            {/* 거품 오버레이 (씻는 중) */}
            {state === "wash" && (
              <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1], x: [-5, 5, -5], y: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute top-0 left-0 w-12 h-12 bg-white/80 rounded-full border border-blue-200 shadow-sm"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], x: [5, -5, 5], y: [5, -5, 5] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute top-8 right-0 w-16 h-16 bg-white/80 rounded-full border border-blue-200 shadow-sm"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.15, 1], x: [-3, 3, -3], y: [3, -3, 3] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="absolute bottom-0 left-4 w-14 h-14 bg-white/80 rounded-full border border-blue-200 shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Name Tag */}
            {config.name && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 bg-white/80 font-black text-[#4a2e1b] shadow-sm whitespace-nowrap"
                style={{
                  top: `-${90 * ((config.type === 'animal' ? 100 : (config.characterSize ?? 100)) / 100)}px`,
                  padding: `${6 * ((config.type === 'animal' ? 100 : (config.characterSize ?? 100)) / 100)}px ${14 * ((config.type === 'animal' ? 100 : (config.characterSize ?? 100)) / 100)}px`,
                  borderRadius: `${999 * ((config.type === 'animal' ? 100 : (config.characterSize ?? 100)) / 100)}px`,
                  fontSize: `${16 * ((config.type === 'animal' ? 100 : (config.characterSize ?? 100)) / 100)}px`,
                  border: `${3 * ((config.type === 'animal' ? 100 : (config.characterSize ?? 100)) / 100)}px solid #4a2e1b`
                }}
              >
                {config.name}
              </div>
            )}
          </div>
        </CharacterWithEyes>
      </motion.div>

      {/* 비눗방울 오버레이 (씻는 중) */}
      {state === "wash" && <BubbleOverlay />}

      {/* 가방 창 */}
      {showBag && (
        <InventoryWindow
          onClose={() => setShowBag(false)}
          onUseItem={handleItemUse}
        />
      )}
    </>
  );
}
