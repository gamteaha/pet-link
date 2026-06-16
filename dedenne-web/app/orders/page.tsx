"use client";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import Link from "next/link";

type OrderItem = {
  id: string;
  item_id: string;
  item_name: string;
  price: number;
};

type Order = {
  id: string;
  ordered_at: string;
  total_items: number;
  total_price: number;
  status: string;
  order_items: OrderItem[];
};

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            order_items (*)
          `)
          .eq("user_id", user.id)
          .order("ordered_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setIsFetching(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, supabase]);

  if (isLoading || !user) {
    return <div className="min-h-screen bg-[#fdf6e3]"></div>;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-3 py-1 bg-[#d8e2b8] text-[#4a2e1b] rounded-full text-sm font-bold border border-[#c5d19d]">결제완료</span>;
      case "pending":
        return <span className="px-3 py-1 bg-[#f8eedb] text-[#a68a7e] rounded-full text-sm font-bold border border-[#e8dac1]">결제대기</span>;
      case "cancelled":
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold border border-red-200">취소됨</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-bold border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf6e3] font-sans text-[#4a2e1b] py-12 px-6 flex flex-col items-center">
      <div className="max-w-4xl w-full flex justify-between items-center mb-10 border-b-4 border-[#e8dac1] pb-6">
        <h1 className="text-5xl font-extrabold tracking-tight">주문내역 📦</h1>
        <Link href="/" className="px-6 py-3 bg-white hover:bg-[#f8eedb] text-[#4a2e1b] border-2 border-[#e8dac1] font-bold rounded-xl transition-colors">
          홈으로 가기
        </Link>
      </div>
      
      <div className="w-full max-w-4xl space-y-6">
        {isFetching ? (
          <div className="text-center py-20">
            <span className="animate-bounce inline-block text-5xl mx-auto mb-4">🐾</span>
            <p className="text-xl font-bold text-[#a68a7e]">주문 내역을 불러오는 중...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border-2 border-[#e8dac1]">
            <span className="text-6xl mb-4 block">🥺</span>
            <p className="text-2xl font-bold text-[#a68a7e] mb-6">아직 주문하신 내역이 없어요.</p>
            <Link href="/" className="inline-block px-8 py-4 bg-[#e07a5f] hover:bg-[#d56b50] text-white font-bold rounded-full text-lg shadow-md transition-transform hover:-translate-y-1">
              캐릭터 상점 구경가기
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-[#e8dac1] hover:border-[#e07a5f] transition-colors group">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b-2 border-dashed border-[#e8dac1]">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-[#a68a7e]">주문일자</span>
                    <span className="text-lg font-black">{formatDate(order.ordered_at)}</span>
                  </div>
                  <div className="text-xs text-[#a68a7e]">
                    주문번호: <span className="font-mono">{order.id.split('-')[0]}...</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-[#fdf6e3] p-4 rounded-xl border border-[#e8dac1]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-[#e8dac1] text-2xl">
                        {item.item_id === 'dedenne' ? '🐭' : item.item_id === 'cat' ? '🐱' : item.item_id === 'human' ? '🧑‍🌾' : '✨'}
                      </div>
                      <span className="font-bold text-lg">{item.item_name}</span>
                    </div>
                    <span className="font-black text-[#e07a5f]">{item.price === 0 ? "무료" : `🧀 ${item.price.toLocaleString()} 개`}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-[#e8dac1]">
                <span className="font-bold text-[#a68a7e]">총 {order.total_items}개 아이템</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">총 결제 금액:</span>
                  <span className="text-3xl font-black text-[#c44933]">🧀 {order.total_price.toLocaleString()} 개</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
