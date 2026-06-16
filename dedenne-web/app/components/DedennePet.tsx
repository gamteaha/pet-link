"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMotionValue, motion, AnimatePresence } from "framer-motion";
import CharacterWithEyes from "./CharacterWithEyes";
import BubbleOverlay from "./BubbleOverlay";

type State = "peek" | "idle" | "walk" | "startled" | "sleep" | "happy" | "speaking" | "wash" | "eat";

// 상황별 사운드 매핑 (데스크톱 버전과 동일한 구조)
const SOUNDS: Record<string, string[]> = {
  greet:   ["/assets/dedenne/sounds/greet_1.wav", "/assets/dedenne/sounds/greet_2.wav"],
  idle:    ["/assets/dedenne/sounds/idle_1.wav", "/assets/dedenne/sounds/idle_2.wav"],
  run:     ["/assets/dedenne/sounds/run_1.wav"],
  swing:   ["/assets/dedenne/sounds/swing_1.wav", "/assets/dedenne/sounds/swing_2.wav", "/assets/dedenne/sounds/swing_3.wav"],
  pat:     ["/assets/dedenne/sounds/pat_1.wav", "/assets/dedenne/sounds/pat_2.wav", "/assets/dedenne/sounds/pat_3.wav", "/assets/dedenne/sounds/pat_4.wav"],
  excited: ["/assets/dedenne/sounds/excited_1.wav", "/assets/dedenne/sounds/excited_2.wav", "/assets/dedenne/sounds/excited_3.wav"],
  explore: ["/assets/dedenne/sounds/explore_1.wav", "/assets/dedenne/sounds/explore_2.wav"],
  owner:   ["/assets/dedenne/sounds/owner_1.wav"],
};

// 카테고리별 대사 매핑
const MESSAGES: Record<string, string[]> = {
  greet:   ["데-덴-네! (안녕!)", "덴네네! (반가워!)"],
  idle:    ["데넨네! (심심해~)", "네-네- (오늘도 화이팅!)", "찌-리-릿! (놀아줘!)"],
  run:     ["뎨뎨뎨! (뾱뾱!)"],
  swing:   ["뎨...! (앗! 깜짝이야!)", "데덴! (하늘을 난다!)", "네-네? (어디 가?)"],
  pat:     ["데덴~ (기분 좋아~)", "찌릿... (간지러워~)", "네네- (더 쓰다듬어줘!)"],
  excited: ["데데넷! (신나!)", "네네넷! (우와!)"],
  explore: ["데? (거기 누구야?)", "네넷! (이것좀 봐!)"],
  owner:   ["데덴넷!! (주인아!!!)", "네넷! 덴네! (여기야 여기!)"],
};

export default function DedennePet() {
  const [isMounted, setIsMounted] = useState(false);
  const [state, setState] = useState<State>("peek");
  const [direction, setDirection] = useState(-1);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [showHeart, setShowHeart] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [animPhase, setAnimPhase] = useState<"idle" | "starting" | "walking" | "stopping">("idle");
  const [frameIndex, setFrameIndex] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(true);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const velocity = useRef({ x: 0, y: 0 });
  const windowSize = useRef({ width: 0, height: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouthTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevStateRef = useRef<State>("idle");
  const audioUnlocked = useRef(false);

  const assets = {
    idle: "/assets/dedenne/mouth-closed/mouth-closed.png",
    basic: "/assets/dedenne/basic.png",
    blink: "/assets/dedenne/blink/blink.png",
    walkStart: [
      "/assets/dedenne/run-right/return-left-1.png",
      "/assets/dedenne/run-right/rightside-2.png",
      "/assets/dedenne/run-right/tail-return-3.png",
    ],
    walkLoop: [
      "/assets/dedenne/run-right/tail-return-and-jump-4.png",
      "/assets/dedenne/run-right/downjump-5.png",
      "/assets/dedenne/run-right/honest-jump-6.png",
      "/assets/dedenne/run-right/downjump-5.png",
    ],
    walkStop: [
      "/assets/dedenne/run-right/tail-return-and-jump-4.png",
      "/assets/dedenne/run-right/tail-return-3.png",
      "/assets/dedenne/run-right/rightside-2.png",
      "/assets/dedenne/run-right/return-left-1.png",
    ],
    happy: "/assets/dedenne/pat-pat/wink-1.png",
    swing: "/assets/dedenne/swing/lifted.png",
  };

  // 오디오 잠금 해제 (브라우저 자동재생 정책 대응)
  const unlockAudio = useCallback(() => {
    if (audioUnlocked.current) return;
    const silentAudio = new Audio();
    silentAudio.volume = 0;
    silentAudio.play().then(() => {
      audioUnlocked.current = true;
      silentAudio.pause();
    }).catch(() => {});
  }, []);

  // 사운드 재생
  const playSound = useCallback((category: string, chance: number = 0.5) => {
    if (Math.random() > chance) return;

    // 이전 소리 중단
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const files = SOUNDS[category];
    if (!files || files.length === 0) return;

    const src = files[Math.floor(Math.random() * files.length)];
    const audio = new Audio(src);
    audio.volume = 0.7;
    audioRef.current = audio;

    audio.play().catch((err) => {
      console.log("오디오 재생 실패 (사용자 상호작용 필요):", err.message);
    });

    return audio;
  }, []);

  // 말하기 (사운드 + 말풍선 + 입 애니메이션)
  const speak = useCallback((category: string, soundChance: number = 0.5, duration: number = 3000) => {
    // 대사 선택
    const msgs = MESSAGES[category];
    if (msgs) {
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      setMessage(msg);
    }

    // 사운드 재생
    const audio = playSound(category, soundChance);

    // 이전 speaking 타이머 정리
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    if (mouthTimerRef.current) clearInterval(mouthTimerRef.current);

    // 이전 상태 저장 (speaking 중이 아닐 때만)
    if (state !== "speaking") {
      prevStateRef.current = state;
    }

    // speaking 상태로 전환
    setState("speaking");
    setMouthOpen(true);

    // 입 뻥긋뻥긋 애니메이션
    mouthTimerRef.current = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 350); // 데스크톱과 동일하게 350ms

    // duration 또는 오디오 종료 시 speaking 해제
    const stopSpeaking = () => {
      if (mouthTimerRef.current) clearInterval(mouthTimerRef.current);
      mouthTimerRef.current = null;
      setMouthOpen(true);
      setMessage("");
      setState(prev => prev === "speaking" ? prevStateRef.current : prev);
    };

    // 오디오가 있으면 오디오 종료 시, 없으면 duration 후 종료
    if (audio) {
      audio.onended = () => {
        speakingTimerRef.current = setTimeout(stopSpeaking, 500); // 오디오 끝난 뒤 0.5초 유지
      };
      // 오디오가 재생 실패했을 수도 있으니 fallback
      speakingTimerRef.current = setTimeout(stopSpeaking, duration);
    } else {
      speakingTimerRef.current = setTimeout(stopSpeaking, duration);
    }
  }, [playSound, state]);

  // 임의의 텍스트 말하기
  const speakRawText = useCallback((text: string, duration: number = 3000) => {
    setMessage(text);

    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    if (mouthTimerRef.current) clearInterval(mouthTimerRef.current);

    if (state !== "speaking") {
      prevStateRef.current = state;
    }

    setState("speaking");
    setMouthOpen(true);

    mouthTimerRef.current = setInterval(() => {
      setMouthOpen(prev => !prev);
    }, 350);

    const stopSpeaking = () => {
      if (mouthTimerRef.current) clearInterval(mouthTimerRef.current);
      mouthTimerRef.current = null;
      setMouthOpen(true);
      setMessage("");
      setState(prev => prev === "speaking" ? prevStateRef.current : prev);
    };

    speakingTimerRef.current = setTimeout(stopSpeaking, duration);
  }, [state]);

  // 첫 유저 인터랙션 시 오디오 잠금 해제
  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [unlockAudio]);

  useEffect(() => {
    console.log("DedennePet: Component Mounted");
    setIsMounted(true);
    if (typeof window !== "undefined") {
      windowSize.current = { width: window.innerWidth, height: window.innerHeight };
      // Start in a more visible position for debugging
      x.set(window.innerWidth - 180);
      y.set(window.innerHeight - 180);
      setState("idle");

      const handleResize = () => {
        windowSize.current = { width: window.innerWidth, height: window.innerHeight };
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // 처음 등장 시 인사 (마운트 후 약간의 딜레이)
  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      speak("greet", 1.0, 3000);
    }, 800);
    return () => clearTimeout(timer);
  }, [isMounted]);

  // Physics Engine
  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (isDragging || state === "peek" || state === "speaking") return;

      const currentX = x.get();
      const currentY = y.get();
      let vx = velocity.current.x;
      let vy = velocity.current.y;

      const floorY = windowSize.current.height - 250;

      // Gravity & Floor
      if (currentY < floorY) {
        vy += 1.5;
        if (state !== "startled") setState("startled");
      } else {
        y.set(floorY);
        vy = 0;
        vx *= 0.75;
        if (state === "startled") setState("idle");
      }

      // Horizontal Movement
      let nx = currentX + vx;
      if (state === "walk") {
        nx += direction * 2;
        const margin = 150;
        if (nx < margin) {
          setDirection(1);
          nx = margin;
        } else if (nx > windowSize.current.width - margin) {
          setDirection(-1);
          nx = windowSize.current.width - margin;
        }
      } else {
        vx *= 0.90;
        if (Math.abs(vx) < 0.1) vx = 0;
      }

      x.set(nx);
      y.set(currentY < floorY ? currentY + vy : floorY);
      velocity.current = { x: vx, y: vy };
    }, 30);

    return () => clearInterval(moveInterval);
  }, [isDragging, state, direction]);

  // Summon Event
  useEffect(() => {
    const handleSummon = () => {
      console.log("Summoning Dedenne Event Received!");
      setState("walk");
      x.set(windowSize.current.width - 250);
      y.set(windowSize.current.height - 250);
      speak("owner", 1.0, 4000);
      setTimeout(() => setState((s) => s === "walk" ? "idle" : s), 5000);
    };
    window.addEventListener("summon-dedenne", handleSummon);
    return () => window.removeEventListener("summon-dedenne", handleSummon);
  }, [speak]);

  // 자율 행동 (idle 상태에서 가끔 혼잣말)
  useEffect(() => {
    if (state !== "idle") return;

    const idleInterval = setInterval(() => {
      if (state !== "idle") return;

      const roll = Math.random();
      if (roll < 0.02) {
        // 가끔 혼잣말
        const categories = ["idle", "excited", "explore"];
        const cat = categories[Math.floor(Math.random() * categories.length)];
        speak(cat, 0.6, 3500);
      }
    }, 1000);

    return () => clearInterval(idleInterval);
  }, [state, speak]);

  // Animation State Sync
  useEffect(() => {
    if (state === "speaking") return; // speaking 중엔 walk 애니메이션 건드리지 않음

    const isMoving = state === "walk" || Math.abs(velocity.current.x) > 1;
    if (isMoving) {
      if (animPhase === "idle" || animPhase === "stopping") {
        setAnimPhase("starting");
        setFrameIndex(0);
      }
    } else {
      if (animPhase === "walking" || animPhase === "starting") {
        setAnimPhase("stopping");
        setFrameIndex(0);
      }
    }
  }, [state]);

  // Animation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (animPhase === "starting") {
      interval = setInterval(() => {
        setFrameIndex(prev => {
          if (prev >= assets.walkStart.length - 1) {
            setAnimPhase("walking");
            return 0;
          }
          return prev + 1;
        });
      }, 250); // 데스크톱과 동일하게 250ms
    } else if (animPhase === "walking") {
      interval = setInterval(() => {
        setFrameIndex(prev => (prev + 1) % assets.walkLoop.length);
      }, 250);
    } else if (animPhase === "stopping") {
      interval = setInterval(() => {
        setFrameIndex(prev => {
          if (prev >= assets.walkStop.length - 1) {
            setAnimPhase("idle");
            return 0;
          }
          return prev + 1;
        });
      }, 250);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [animPhase, assets.walkStart.length, assets.walkLoop.length, assets.walkStop.length]);

  // 현재 상태에 맞는 스프라이트 이미지 결정
  const getCurrentSprite = () => {
    if (isDragging || state === "startled") return assets.swing;
    if (state === "happy" || state === "eat" || state === "wash") return assets.happy;
    if (state === "speaking") return mouthOpen ? assets.basic : assets.idle;
    if (animPhase === "starting") return assets.walkStart[frameIndex];
    if (animPhase === "walking") return assets.walkLoop[frameIndex];
    if (animPhase === "stopping") return assets.walkStop[frameIndex];
    if (state === "sleep" || batteryLevel < 0.2) return assets.blink;
    return assets.idle;
  };

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <motion.div 
        drag
        dragMomentum={false}
        onDragStart={() => {
          setIsDragging(true);
          unlockAudio();
          speak("swing", 1.0, 2500);
          velocity.current = { x: 0, y: 0 };
        }}
        onDragEnd={(e, info) => {
          setIsDragging(false);
          velocity.current = { x: info.velocity.x / 30, y: info.velocity.y / 30 };
        }}
        style={{ x, y }}
        className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        <div 
          className="relative group"
          onMouseEnter={() => {
            setIsHovered(true);
            if (!message && state === "idle") {
              speak("greet", 0.4, 2500);
            }
          }}
          onMouseLeave={() => {
            setIsHovered(false);
          }}
        >
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -20, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-white border-2 border-dedenne p-3 rounded-2xl shadow-2xl text-sm font-black text-neutral-800 whitespace-nowrap z-[10000]"
              >
                {/* 말하는 중일 때 물결 효과 */}
                {state === "speaking" && (
                  <motion.span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-dedenne rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  />
                )}
                {message}
                <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.1 }}
            onClick={() => {
              if (isDragging) return;
              unlockAudio();
              setState("happy");
              setShowHeart(true);
              speak("pat", 0.8, 2500);
              setTimeout(() => {
                setShowHeart(false);
                setState(prev => prev === "happy" || prev === "speaking" ? "idle" : prev);
              }, 3000);
            }}
            className="w-44 h-44 md:w-56 md:h-56 lg:w-72 lg:h-72 flex items-center justify-center"
          >
            <CharacterWithEyes 
              className="w-full h-full flex items-center justify-center"
              onFeed={(itemId) => {
                if (itemId === 'bread' || itemId === 'strawberry') {
                  setState("eat");
                  speakRawText("냠냠! 배고파요!", 2000);
                  setTimeout(() => setState("idle"), 2000);
                } else if (itemId === 'soap' || itemId === 'towel') {
                  setState("wash");
                  speakRawText("🧼 깨끗해져요~", 2000);
                  setTimeout(() => setState("idle"), 2000);
                } else {
                  setState("happy");
                  setShowHeart(true);
                  speak("pat", 0.8, 2500);
                  setTimeout(() => {
                    setShowHeart(false);
                    setState(prev => prev === "happy" || prev === "speaking" ? "idle" : prev);
                  }, 3000);
                }
              }}
            >
              {/* 거품 오버레이 (씻는 중) */}
              {state === "wash" && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], x: [-5, 5, -5], y: [-5, 5, -5] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute top-4 left-4 w-12 h-12 bg-white/80 rounded-full border border-blue-200 shadow-sm"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], x: [5, -5, 5], y: [5, -5, 5] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="absolute top-10 right-4 w-16 h-16 bg-white/80 rounded-full border border-blue-200 shadow-sm"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.15, 1], x: [-3, 3, -3], y: [3, -3, 3] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      className="absolute bottom-4 left-10 w-14 h-14 bg-white/80 rounded-full border border-blue-200 shadow-sm"
                    />
                  </div>
                </div>
              )}

              <motion.img 
                src={getCurrentSprite()} 
                alt="Dedenne" 
                draggable={false}
                className="w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 object-contain drop-shadow-2xl filter brightness-110 select-none origin-top pointer-events-none"
                style={{ WebkitUserDrag: "none" } as React.CSSProperties}
                animate={{ 
                  scaleX: direction,
                  rotate: isDragging || state === "startled" ? [-10, 10] : 0 
                }}
                transition={{ 
                  rotate: {
                    repeat: isDragging || state === "startled" ? Infinity : 0,
                    repeatType: "mirror",
                    duration: 0.4,
                    ease: "easeInOut"
                  },
                  scaleX: { duration: 0 }
                }}
              />
            </CharacterWithEyes>
            {showHeart && (
              <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -80 }} className="absolute top-0 left-1/2 text-5xl md:text-6xl">
                ❤️
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
