"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { useCheese } from "../../../context/CheeseContext";
import { createClient } from "../../../utils/supabase/client";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addCheese } = useCheese();
  const supabase = createClient();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [chargedAmount, setChargedAmount] = useState(0);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (hasFetchedRef.current) return;

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    if (!user) {
      setStatus("error");
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    hasFetchedRef.current = true;

    const confirmPayment = async () => {
      try {
        // 1. 토스페이먼츠 최종 결제 승인
        const res = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "결제 승인 실패");
        }

        // 2. 결제 금액 기준으로 치즈 지급 (1,000원 = 치즈 1개) 및 보너스 계산
        const baseCheese = Math.floor(Number(amount) / 1000);
        let bonusCheese = 0;
        if (baseCheese === 30) bonusCheese = 2;
        else if (baseCheese === 50) bonusCheese = 5;
        else if (baseCheese === 100) bonusCheese = 15;
        
        const cheeseToAdd = baseCheese + bonusCheese;
        setChargedAmount(cheeseToAdd);

        const success = await addCheese(cheeseToAdd);
        if (!success) throw new Error("치즈 지급에 실패했습니다.");

        // 2.5 충전 내역 기록 (orders 테이블 활용)
        const { error: orderError } = await supabase.from('orders').insert({
          user_id: user.id,
          total_items: cheeseToAdd, // 충전된 치즈 수
          total_price: Number(amount), // 결제 금액(KRW)
          status: 'completed'
        });
        if (orderError) {
          console.error("충전 내역 저장 에러:", orderError);
        }

        // 2.6 치즈 변동 로그(원장)에 기록
        const { data: profileData } = await supabase.from('profiles').select('cheese_balance').eq('id', user.id).single();
        const currentBalance = profileData?.cheese_balance || 0;

        await supabase.from('cheese_logs').insert({
          user_id: user.id,
          change_type: 'charge',
          amount: cheeseToAdd,
          balance_after: currentBalance, // 방금 업데이트된 후의 잔액이거나 예상 잔액
          reason: `토스페이먼츠 결제 (결제금액: ${Number(amount)}원)`
        });

        // 3. 성공 표시 및 이동
        setStatus("success");
        setToastVisible(true);

        setTimeout(() => {
          router.push("/");
        }, 2000);

      } catch (err: any) {
        console.error("Payment Confirmation Error:", err);
        setStatus("error");
        setErrorMessage("결제 처리에 실패했습니다. 고객센터로 문의해주세요.");
      }
    };

    confirmPayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#fdf6e3] flex flex-col items-center justify-center font-sans text-[#4a2e1b]">
        <span className="animate-bounce inline-block text-6xl mb-6">🐾</span>
        <h2 className="text-2xl font-black">결제를 안전하게 처리하고 있습니다...</h2>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#fdf6e3] flex flex-col items-center justify-center font-sans px-6">
        <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl border-[6px] border-[#4a2e1b]">
          <div className="text-7xl mb-6">⚠️</div>
          <h2 className="text-3xl font-black text-red-500 mb-4">결제 실패</h2>
          <p className="text-[#a68a7e] font-bold text-lg mb-8">{errorMessage}</p>
          <Link href="/charge" className="inline-block w-full py-4 bg-[#f8eedb] hover:bg-[#e8dac1] text-[#4a2e1b] rounded-xl font-black text-xl transition-transform hover:scale-105">
            충전소로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf6e3] flex flex-col items-center justify-center font-sans px-6">
      <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl border-[6px] border-[#e8dac1]">
        <div className="text-7xl mb-6">🧀</div>
        <h2 className="text-3xl font-black text-[#8c4a23] mb-3">충전 완료!</h2>
        <p className="text-[#a68a7e] font-bold text-lg">잠시 후 메인으로 이동합니다...</p>
      </div>

      {toastVisible && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-full font-black shadow-2xl bg-[#8c4a23] text-white text-xl animate-bounce">
          치즈 {chargedAmount}개가 충전되었습니다! 🎉
        </div>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdf6e3]"></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
