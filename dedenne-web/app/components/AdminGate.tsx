"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_PASSWORD = "kth0402kth^^";

export default function AdminGate() {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setShowModal(false);
      setPassword("");
      setError("");
      // 세션에 관리자 인증 상태 저장
      sessionStorage.setItem("adminAuth", "true");
      router.push("/admin");
    } else {
      setError("비밀번호가 올바르지 않습니다.");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword("");
    }
  };

  return (
    <>
      {/* 좌측 하단 고정 관리자 버튼 */}
      <button
        onClick={() => {
          setShowModal(true);
          setError("");
          setPassword("");
        }}
        className="fixed bottom-4 left-4 z-[50] px-3 py-1.5 rounded-lg text-xs font-medium opacity-30 hover:opacity-80 transition-opacity duration-300 bg-[#4a2e1b]/10 text-[#4a2e1b]/60 hover:bg-[#4a2e1b]/20 hover:text-[#4a2e1b] border border-transparent hover:border-[#4a2e1b]/20"
        title="관리자 메뉴"
      >
        🔒 관리자
      </button>

      {/* 비밀번호 입력 모달 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                x: isShaking ? [0, -10, 10, -10, 10, 0] : 0,
              }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
                x: { duration: 0.4 },
              }}
              className="bg-[#fdf6e3] rounded-3xl border-4 border-[#4a2e1b] p-8 w-full max-w-sm shadow-2xl mx-4"
            >
              {/* 모달 헤더 */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#4a2e1b]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h2 className="text-2xl font-black text-[#4a2e1b]">
                  관리자 인증
                </h2>
                <p className="text-sm text-[#a68a7e] mt-1 font-medium">
                  관리자 비밀번호를 입력해주세요
                </p>
              </div>

              {/* 비밀번호 폼 */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    ref={inputRef}
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="비밀번호 입력..."
                    className="w-full px-4 py-3 bg-white border-3 border-[#e8dac1] rounded-xl text-[#4a2e1b] font-bold text-center text-lg tracking-widest placeholder:text-[#c4b3a9] placeholder:tracking-normal focus:outline-none focus:border-[#e07a5f] focus:ring-2 focus:ring-[#e07a5f]/20 transition-all"
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[#e07a5f] text-sm font-bold text-center mt-2"
                    >
                      ⚠️ {error}
                    </motion.p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 bg-[#e8dac1] hover:bg-[#d4c5b2] text-[#4a2e1b] font-bold rounded-xl transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={!password}
                    className="flex-1 py-3 bg-[#4a2e1b] hover:bg-[#3a1e0b] disabled:bg-[#c4b3a9] text-white font-bold rounded-xl transition-colors disabled:cursor-not-allowed"
                  >
                    확인
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
