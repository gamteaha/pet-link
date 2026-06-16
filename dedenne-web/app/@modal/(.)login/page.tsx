"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { createClient } from "../../../utils/supabase/client";

export default function AuthModal() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.back();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6"
      onClick={() => router.back()}
    >
      <div 
        className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl border-2 border-[#e8dac1] text-center relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button 
          onClick={() => router.back()}
          className="absolute top-4 right-4 text-[#a68a7e] hover:text-[#e07a5f] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* 상단 장식 배경 */}
        <div className="absolute top-0 left-0 w-full h-32 bg-[#f8eedb] -z-10 rounded-t-[2rem]"></div>
        
        {/* 로고 / 아이콘 영역 */}
        <div className="w-24 h-24 bg-white rounded-full flex justify-center items-center shadow-sm border-2 border-[#e8dac1] mx-auto mt-2 mb-6 transform hover:scale-110 transition-transform duration-300">
          <span className="text-5xl">🐾</span>
        </div>

        {/* 타이틀 및 설명 */}
        <h1 className="text-3xl font-extrabold tracking-tight mb-3 text-[#4a2e1b]">
          Pet-Link 시작하기
        </h1>
        <p className="text-[#a68a7e] font-medium mb-10 leading-relaxed">
          단 하나의 소셜 계정으로 간편하게!<br />
          당신만의 특별한 캐릭터를 만나보세요.
        </p>

        {/* 구글 로그인 버튼 */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-white border-2 border-[#e8dac1] hover:border-[#e07a5f] hover:bg-[#fdf6e3] rounded-full font-bold text-lg text-[#4a2e1b] shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google 계정으로 계속하기
        </button>
      </div>
    </div>
  );
}
