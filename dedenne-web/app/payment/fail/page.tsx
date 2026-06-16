"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // URL에서 실패 사유 파라미터 추출
    const code = searchParams.get("code");
    const message = searchParams.get("message");
    const orderId = searchParams.get("orderId");

    // 에러 메시지 설정
    const displayMessage = message ? decodeURIComponent(message) : "알 수 없는 오류가 발생했습니다.";
    setToastMessage(`결제에 실패했습니다: ${displayMessage}`);

    // 3초 후 토스트 숨기고 장바구니로 이동
    const timer = setTimeout(() => {
      setToastMessage(null);
      router.push("/cart");
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#fdf6e3] flex flex-col items-center justify-center font-sans px-6 relative overflow-hidden">
      
      {/* Toast Notification (Slide Down) */}
      <div 
        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-full font-black shadow-2xl bg-red-500 text-white text-lg transition-transform duration-500 flex items-center gap-3 max-w-[90%] text-center ${
          toastMessage ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
        }`}
      >
        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {toastMessage}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl border-[6px] border-[#4a2e1b] animate-fade-in">
        <div className="text-7xl mb-8 animate-bounce">🛒</div>
        <h2 className="text-3xl font-black text-[#4a2e1b] mb-4">잠시 후 장바구니로 돌아갑니다...</h2>
        <p className="text-[#a68a7e] font-bold text-lg">
          결제가 완료되지 않았습니다. 장바구니에서 다시 결제를 진행해주세요.
        </p>
      </div>

    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdf6e3]"></div>}>
      <PaymentFailContent />
    </Suspense>
  );
}
