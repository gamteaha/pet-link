"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function WebTutorial() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // step 0 = idle (show start button)
  // step 1 = started, not logged in → point at login button
  // step 2 = logged in, on home → point at profile avatar
  // step 3 = /my-pets → guide bag button
  // step 4 = /my-pets → guide inventory transfer
  const [step, setStep] = useState<number>(0);

  // 유저 ID 기반 키 (계정별 분리)
  const completedKey = user ? `webTutorialComplete_${user.id}` : null;
  const stepKey = user ? `webTutorialStep_${user.id}` : null;

  // 유저가 바뀌면 해당 유저의 튜토리얼 상태 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!completedKey || !stepKey) { setStep(0); return; }
    const completed = localStorage.getItem(completedKey);
    if (completed) { setStep(-1); return; }
    const saved = localStorage.getItem(stepKey);
    setStep(saved ? parseInt(saved) : 0);
  }, [user?.id]);

  useEffect(() => {
    const handleStart = () => {
      if (!completedKey || !stepKey) return;
      if (!localStorage.getItem(completedKey)) {
        localStorage.setItem(stepKey, "2");
        setStep(2);
      }
    };
    window.addEventListener("startWebTutorial", handleStart);
    return () => window.removeEventListener("startWebTutorial", handleStart);
  }, [completedKey, stepKey]);

  // 스텝 변경 시 해당 유저 키로 저장
  useEffect(() => {
    if (step > 0 && stepKey) localStorage.setItem(stepKey, String(step));
  }, [step, stepKey]);

  // Advance step based on login state + pathname
  useEffect(() => {
    if (step <= 0 || step === -1) return;
    if (pathname === "/desktop") return;

    if (step === 1 && user) {
      // User just logged in → advance to step 2
      setStep(2);
    }
    if (step === 2 && pathname === "/my-pets") {
      // User navigated to my-pets → advance to step 3 (bag button guide)
      giveRewardsAndAdvance();
    }
  }, [user, pathname, step]);

  // step 변경 시 CustomEvent 로 broadcast → my-pets가 듯고 직접 마크
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__tutorialStep = step;
    window.dispatchEvent(new CustomEvent('tutorialStepChange', { detail: step }));
  }, [step]);

  useEffect(() => {
    (window as any).__tutorialAdvanceToStep4 = () => {
      if (step === 3) setStep(4);
    };
    return () => { delete (window as any).__tutorialAdvanceToStep4; };
  }, [step]);

  const giveRewardsAndAdvance = async () => {
    if (!user) return;
    try {
      const { data: invData } = await supabase
        .from("user_inventory")
        .select("item_id, quantity")
        .eq("user_id", user.id)
        .in("item_id", ["soap", "strawberry"]);

      const existingInv = (invData || []).reduce((acc: any, row) => {
        acc[row.item_id] = row.quantity;
        return acc;
      }, {});

      await supabase.from("user_inventory").upsert(
        [
          { user_id: user.id, item_id: "soap", quantity: (existingInv["soap"] || 0) + 1, updated_at: new Date().toISOString() },
          { user_id: user.id, item_id: "strawberry", quantity: (existingInv["strawberry"] || 0) + 1, updated_at: new Date().toISOString() },
        ],
        { onConflict: "user_id, item_id" }
      );
    } catch (err) {
      console.error("Tutorial reward error:", err);
    }
    setStep(3); // go to step 3: show bag-button guide
  };

  const advanceToItemGuide = () => {
    setStep(4);
  };

  const startTutorial = () => {
    setStep(user ? 2 : 1);
  };

  const finishTutorial = () => {
    if (completedKey) localStorage.setItem(completedKey, "true");
    if (stepKey) localStorage.removeItem(stepKey);
    setStep(-1);
    window.location.reload();
  };

  // Permanently done or desktop
  if (step <= 0 || step === -1 || pathname === "/desktop") return null;

  return (
    <>
      {/* ── STEP 1: 비로그인 → 로그인 버튼 가리킴 (삭제하거나 남겨둠. 자동 시작 시 바로 step 2) ── */}
      <AnimatePresence>
        {step === 1 && pathname === "/" && (
          <div className="fixed inset-0 pointer-events-none z-[99999]">
            {/* 가짜 마우스: 로그인 버튼 위치(우측 맨 끝) */}
            <motion.div
              key="cursor-login"
              initial={{ opacity: 0, x: "60vw", y: "30vh" }}
              animate={{ opacity: 1, x: "calc(100vw - 110px)", y: "28px" }}
              transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8, repeatType: "reverse" }}
              className="absolute text-5xl drop-shadow-lg"
            >
              👆
            </motion.div>

            {/* 데덴네 말풍선: 좌측 상단 데덴네 버튼 바로 옆 */}
            <div className="absolute top-4 left-20 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="bg-white border-4 border-[#e8dac1] p-4 rounded-3xl rounded-tl-none shadow-xl max-w-xs relative"
              >
                <p className="font-bold text-[#4a2e1b] text-base leading-snug">
                  안녕! 나 데덴네야! 🐭<br /><br />
                  먼저 우측 상단의<br />
                  <span className="text-[#e07a5f] font-black text-lg">로그인 버튼</span>을 눌러봐!
                </p>
                <div className="absolute -left-4 top-4 w-4 h-4 bg-white border-l-4 border-t-4 border-[#e8dac1] rotate-45" />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── STEP 2: 로그인 완료 → 프로필(나의 펫) 가리킴 (전역) ── */}
      <AnimatePresence>
        {step === 2 && (
          <div className="fixed inset-0 pointer-events-none z-[99999]">
            {/* 가짜 마우스: 프로필 아바타 위치 */}
            <motion.div
              key="cursor-profile"
              initial={{ opacity: 0, x: "70vw", y: "40vh" }}
              animate={{ opacity: 1, x: "calc(100vw - 56px)", y: "20px" }}
              transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8, repeatType: "reverse" }}
              className="absolute text-5xl drop-shadow-lg"
            >
              👆
            </motion.div>

            {/* 데덴네 말풍선: 좌측 상단 */}
            <div className="absolute top-4 left-20 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border-4 border-[#e8dac1] p-4 rounded-3xl rounded-tl-none shadow-xl max-w-xs relative"
              >
                <p className="font-bold text-[#4a2e1b] text-base leading-snug">
                  로그인 완료! 잘 했어 😊<br /><br />
                  이제 우측 상단<br />
                  <span className="text-[#e07a5f] font-black text-lg">프로필 사진</span>을 클릭하고<br />
                  <span className="text-[#e07a5f] font-black text-lg">[🐾 나의 펫]</span>을 눌러봐!
                </p>
                <div className="absolute -left-4 top-4 w-4 h-4 bg-white border-l-4 border-t-4 border-[#e8dac1] rotate-45" />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── STEP 3: /my-pets → 가방 관리 버튼 먼저 클릭 안내 (버튼 강조는 my-pets에서) ── */}
      <AnimatePresence>
        {step === 3 && pathname === "/my-pets" && (
          <div className="fixed inset-0 pointer-events-none z-[99999]">
            <div className="absolute top-4 left-20 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border-4 border-[#e8dac1] p-5 rounded-3xl rounded-tl-none shadow-xl max-w-sm relative"
              >
                <p className="font-bold text-[#4a2e1b] text-base leading-snug">
                  내 펫 목록이 보이지? 😊<br /><br />
                  오른쪽에서 펫을 골라<br />
                  <span className="text-[#e07a5f] font-black animate-pulse">👇 이 캐릭터의 가방 관리</span><br />
                  버튼을 눌러봐!
                </p>
                <div className="absolute -left-4 top-4 w-4 h-4 bg-white border-l-4 border-t-4 border-[#e8dac1] rotate-45" />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── STEP 4: /my-pets → 인벤토리 이동 안내 (버튼 강조는 my-pets에서) ── */}
      <AnimatePresence>
        {step === 4 && pathname === "/my-pets" && (
          <div className="fixed inset-0 pointer-events-none z-[99999]">
            <div className="absolute top-4 left-20 pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border-4 border-[#e8dac1] p-5 rounded-3xl rounded-tl-none shadow-xl max-w-sm relative"
              >
                <p className="font-bold text-[#4a2e1b] text-base leading-snug mb-4">
                  비누🧼 랑 딸기🍓를 선물로 줬어! 🎁<br /><br />
                  <span className="text-[#8c4a23] font-black text-xl">▶</span> 버튼으로 아이템을 가방에 넣고,<br />
                  <span className="text-[#e07a5f] font-black">[💾 변경사항 저장]</span>을 꼭 눌러줘!
                </p>
                <button
                  onClick={finishTutorial}
                  className="w-full bg-[#e07a5f] hover:bg-[#d56b50] text-white font-black text-lg py-3 px-5 rounded-xl shadow-md transition-transform hover:scale-105 pointer-events-auto"
                >
                  다 배웠어요! ✅
                </button>
                <div className="absolute -left-4 top-4 w-4 h-4 bg-white border-l-4 border-t-4 border-[#e8dac1] rotate-45" />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
