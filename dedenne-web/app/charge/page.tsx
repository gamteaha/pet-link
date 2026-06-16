"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useCheese } from "../../context/CheeseContext";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { createClient } from "../../utils/supabase/client";

export default function ChargePage() {
  const { user } = useAuth();
  const { cheeseBalance, addCheese } = useCheese();
  const router = useRouter();
  const [isCharging, setIsCharging] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const supabase = createClient();
  const [chargeHistory, setChargeHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({ name: "", email: "" });
  const [paymentErrors, setPaymentErrors] = useState({ name: "", email: "" });
  const [selectedOption, setSelectedOption] = useState<{ amount: number, bonus: number, price: number } | null>(null);

  const chargeOptions = [
    { amount: 10, bonus: 0, price: 10000 },
    { amount: 30, bonus: 2, price: 30000 },
    { amount: 50, bonus: 5, price: 50000 },
    { amount: 100, bonus: 15, price: 100000 },
  ];

  useEffect(() => {
    if (!user) {
      setChargeHistory([]);
      setIsLoadingHistory(false);
      return;
    }

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .gte('total_price', 1000) // 1000원 이상은 치즈 충전으로 간주
        .order('ordered_at', { ascending: false });
        
      if (!error && data) {
        setChargeHistory(data);
      }
      setIsLoadingHistory(false);
    };

    fetchHistory();

    const channel = supabase
      .channel("charge_history_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const initiateCharge = (option: { amount: number, bonus: number, price: number }) => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    setSelectedOption(option);
    setPaymentInfo({
      name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      email: user.email || ""
    });
    setPaymentErrors({ name: "", email: "" });
    setShowPaymentInfoModal(true);
  };

  const validateAndSubmit = () => {
    let valid = true;
    const errors = { name: "", email: "" };
    if (!paymentInfo.name.trim()) {
      errors.name = "이름을 입력해주세요.";
      valid = false;
    }
    if (!paymentInfo.email.trim() || !/\S+@\S+\.\S+/.test(paymentInfo.email)) {
      errors.email = "유효한 이메일을 입력해주세요.";
      valid = false;
    }
    setPaymentErrors(errors);
    
    if (valid) {
      setShowPaymentInfoModal(false);
      processCharge();
    }
  };

  const processCharge = async () => {
    if (!user || !selectedOption) return;
    setIsCharging(true);

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("토스페이먼츠 클라이언트 키가 설정되지 않았습니다.");
      }

      const totalCheese = selectedOption.amount + selectedOption.bonus;
      const orderName = `치즈 ${totalCheese}개 충전`;

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: user.id });

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: selectedOption.price,
        },
        orderId: 'PET-CHARGE-' + Date.now(),
        orderName: orderName,
        customerName: paymentInfo.name,
        customerEmail: paymentInfo.email,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
      
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "결제 요청에 실패했습니다. 다시 시도해 주세요.");
      setIsCharging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf6e3] font-sans text-[#4a2e1b] py-12 px-6 flex flex-col items-center">
      <div className="max-w-4xl w-full flex justify-between items-center mb-10 border-b-4 border-[#e8dac1] pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight">치즈 충전소 🧀</h1>
        <Link href="/" className="px-6 py-3 bg-[#e2d5c4] hover:bg-[#d4c5b2] text-[#4a2e1b] font-bold rounded-xl transition-colors">
          돌아가기
        </Link>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-[3rem] p-10 shadow-lg border-[6px] border-[#4a2e1b] text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">현재 보유 치즈</h2>
        <div className="text-6xl font-black text-[#e07a5f] mb-6">🧀 {cheeseBalance} 개</div>
        <p className="text-[#a68a7e] font-medium">원하는 개수의 치즈를 선택하여 결제해주세요. (1개당 1,000원)</p>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {chargeOptions.map((option, index) => (
          <div key={index} className="bg-white rounded-3xl p-6 border-4 border-[#e8dac1] hover:border-[#e07a5f] shadow-sm hover:shadow-lg transition-all flex flex-col items-center group relative overflow-hidden cursor-pointer" onClick={() => !isCharging && initiateCharge(option)}>
            {option.bonus > 0 && (
              <div className="absolute top-4 left-[-30px] bg-[#c44933] text-white font-black text-sm py-1 px-10 -rotate-45 shadow-md">
                +{option.bonus} 보너스!
              </div>
            )}
            
            <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">🧀</div>
            <h3 className="text-3xl font-black mb-2">{option.amount} + {option.bonus} 개</h3>
            <div className="text-xl font-bold text-[#a68a7e] mb-6">{option.price.toLocaleString()} 원</div>
            
            <button 
              disabled={isCharging}
              className="w-full py-4 bg-[#f8eedb] group-hover:bg-[#e07a5f] group-hover:text-white border-[3px] border-[#e07a5f] text-[#e07a5f] rounded-2xl font-black text-xl transition-colors disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-500"
            >
              충전하기
            </button>
          </div>
        ))}
      </div>

      {/* 나의 치즈 충전 내역 */}
      <div className="max-w-4xl w-full mt-16 bg-white rounded-[3rem] p-10 shadow-lg border-4 border-[#e8dac1]">
        <h2 className="text-3xl font-black mb-8 text-center border-b-2 border-[#e8dac1] pb-4">나의 치즈 충전 내역</h2>
        
        {!user ? (
          <div className="text-center py-10">
            <p className="text-xl font-bold text-[#a68a7e]">로그인 후 충전 내역을 확인하세요.</p>
            <Link href="/login" className="mt-4 inline-block px-6 py-3 bg-[#e07a5f] text-white rounded-full font-bold shadow-md">
              로그인하기
            </Link>
          </div>
        ) : isLoadingHistory ? (
          <div className="flex justify-center py-10">
            <span className="animate-bounce inline-block text-5xl">🐾</span>
          </div>
        ) : chargeHistory.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl font-bold text-[#a68a7e]">아직 치즈를 충전한 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8eedb] text-[#a68a7e]">
                  <th className="p-4 rounded-tl-xl font-bold">충전 일시</th>
                  <th className="p-4 font-bold text-center">충전된 치즈</th>
                  <th className="p-4 font-bold text-right">결제 금액</th>
                  <th className="p-4 rounded-tr-xl font-bold text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {chargeHistory.map((history) => (
                  <tr key={history.id} className="border-b border-[#e8dac1] hover:bg-[#fdf6e3] transition-colors">
                    <td className="p-4 font-bold text-[#4a2e1b]">
                      {new Date(history.ordered_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="p-4 text-center font-black text-[#e07a5f]">
                      🧀 {history.total_items} 개
                    </td>
                    <td className="p-4 text-right font-bold text-[#a68a7e]">
                      {history.total_price.toLocaleString()} 원
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        history.status === 'completed' ? 'bg-[#d8e2b8] text-[#4a2e1b]' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {history.status === 'completed' ? '결제완료' : history.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCharging && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <span className="animate-bounce inline-block text-6xl mb-4">🐾</span>
            <h2 className="text-2xl font-bold text-[#4a2e1b]">결제 진행 중...</h2>
            <p className="text-[#a68a7e] mt-2">잠시만 기다려주세요.</p>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-full font-bold shadow-xl bg-[#8c4a23] text-white text-lg animate-bounce">
          {toastMsg}
        </div>
      )}

      {showPaymentInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110]">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full mx-4 shadow-2xl flex flex-col border-[6px] border-[#4a2e1b] animate-fade-in">
            <h3 className="text-3xl font-black mb-6 text-[#4a2e1b] text-center">결제자 정보 입력</h3>
            
            <div className="flex flex-col gap-4 mb-8">
              <div>
                <label className="block text-[#a68a7e] font-bold mb-2">이름 <span className="text-[#e07a5f]">*</span></label>
                <input 
                  type="text" 
                  value={paymentInfo.name}
                  onChange={(e) => setPaymentInfo({...paymentInfo, name: e.target.value})}
                  className={`w-full p-4 rounded-xl border-2 bg-[#f8eedb] font-bold focus:outline-none focus:border-[#e07a5f] ${paymentErrors.name ? 'border-red-500' : 'border-[#e8dac1]'}`}
                  placeholder="홍길동"
                />
                {paymentErrors.name && <p className="text-red-500 text-sm mt-1 font-bold">{paymentErrors.name}</p>}
              </div>

              <div>
                <label className="block text-[#a68a7e] font-bold mb-2">이메일 <span className="text-[#e07a5f]">*</span></label>
                <input 
                  type="email" 
                  value={paymentInfo.email}
                  onChange={(e) => setPaymentInfo({...paymentInfo, email: e.target.value})}
                  className={`w-full p-4 rounded-xl border-2 bg-[#f8eedb] font-bold focus:outline-none focus:border-[#e07a5f] ${paymentErrors.email ? 'border-red-500' : 'border-[#e8dac1]'}`}
                  placeholder="example@email.com"
                />
                {paymentErrors.email && <p className="text-red-500 text-sm mt-1 font-bold">{paymentErrors.email}</p>}
              </div>
            </div>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowPaymentInfoModal(false)}
                className="flex-1 py-4 bg-[#f8eedb] hover:bg-[#e8dac1] text-[#4a2e1b] rounded-xl font-bold text-lg shadow-sm transition-transform hover:scale-105"
              >
                취소
              </button>
              <button 
                onClick={validateAndSubmit}
                className="flex-1 py-4 bg-[#c44933] hover:bg-[#a33926] text-white rounded-xl font-bold text-lg shadow-sm transition-transform hover:scale-105"
              >
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
