"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "../../../../utils/supabase/client";

type UserDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: any | null;
};

export default function UserDetailModal({ isOpen, onClose, user }: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "orders">("inventory");
  const [inventory, setInventory] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cheeseLogs, setCheeseLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && user) {
      fetchUserData();
    }
  }, [isOpen, user]);

  const fetchUserData = async () => {
    setIsLoading(true);
    
    // 1. 인벤토리 목록 가져오기
    const { data: invData } = await supabase
      .from("user_inventory")
      .select(`
        *,
        items (
          name,
          category,
          emoji
        )
      `)
      .eq("user_id", user.id);

    if (invData) setInventory(invData);

    // 2. 주문 내역 및 order_items 가져오기
    const { data: ordData } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          item_name,
          price,
          items (
            category,
            emoji
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordData) setOrders(ordData);

    // 3. 치즈 로그 가져오기
    const { data: logData } = await supabase
      .from("cheese_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (logData) setCheeseLogs(logData);

    setIsLoading(false);
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#fdf6e3] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-4 border-[#e8dac1] shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#e8dac1] flex justify-between items-center bg-white">
            <div>
              <h2 className="text-2xl font-black text-[#4a2e1b]">회원 상세 정보</h2>
              <p className="text-[#a68a7e] font-bold text-sm mt-1">
                {user.display_name || "이름 없음"} ({user.email || "이메일 없음"})
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f8eedb] text-[#4a2e1b] hover:bg-[#e8dac1] transition-colors font-black text-lg"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#e8dac1] bg-white px-6 pt-4 gap-4">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${
                activeTab === "inventory"
                  ? "border-[#e07a5f] text-[#e07a5f]"
                  : "border-transparent text-[#a68a7e] hover:text-[#4a2e1b]"
              }`}
            >
              인벤토리 현황
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${
                activeTab === "orders"
                  ? "border-[#e07a5f] text-[#e07a5f]"
                  : "border-transparent text-[#a68a7e] hover:text-[#4a2e1b]"
              }`}
            >
              현금 결제 내역
            </button>
            <button
              onClick={() => setActiveTab("cheeseLogs" as any)}
              className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${
                activeTab === "cheeseLogs"
                  ? "border-[#e07a5f] text-[#e07a5f]"
                  : "border-transparent text-[#a68a7e] hover:text-[#4a2e1b]"
              }`}
            >
              치즈 사용 내역
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8eedb]/30">
            {isLoading ? (
              <div className="text-center py-12 text-[#a68a7e] font-bold">
                데이터를 불러오는 중입니다...
              </div>
            ) : (
              <>
                {/* 인벤토리 탭 */}
                {activeTab === "inventory" && (
                  <div>
                    {inventory.length === 0 ? (
                      <div className="text-center py-12 text-[#a68a7e] font-bold bg-white rounded-2xl border border-[#e8dac1]">
                        보유 중인 아이템이 없습니다.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {inventory.map((inv) => (
                          <div key={inv.id} className="bg-white p-4 rounded-2xl border-2 border-[#e8dac1] flex flex-col items-center justify-center text-center relative group hover:border-[#e07a5f] transition-colors">
                            <div className="w-16 h-16 bg-[#f8eedb] rounded-full flex items-center justify-center text-4xl mb-3 shadow-sm group-hover:scale-110 transition-transform">
                              {inv.items?.emoji || "📦"}
                            </div>
                            <h3 className="font-bold text-[#4a2e1b]">{inv.items?.name || inv.item_id}</h3>
                            <div className="mt-2 inline-block px-3 py-1 bg-[#4a2e1b] text-white text-xs font-black rounded-full">
                              {inv.quantity} 개
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 주문 내역 탭 */}
                {activeTab === "orders" && (
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <div className="text-center py-12 text-[#a68a7e] font-bold bg-white rounded-2xl border border-[#e8dac1]">
                        주문 내역이 없습니다.
                      </div>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl border-2 border-[#e8dac1] overflow-hidden">
                          <div className="p-4 bg-[#f8eedb] border-b border-[#e8dac1] flex flex-wrap justify-between items-center gap-4">
                            <div>
                              <span className="font-black text-[#4a2e1b] mr-2">
                                {new Date(order.created_at).toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-gray-500 uppercase">
                                #{order.id.split("-")[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-[#e07a5f]">
                                {order.total_price >= 1000 ? `₩ ${order.total_price.toLocaleString()}` : `🧀 ${order.total_price}`}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                order.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}>
                                {order.status === "completed" ? "결제완료" : "주문취소"}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {order.order_items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="text-2xl">{item.items?.emoji || "📦"}</div>
                                <div>
                                  <p className="font-bold text-[#4a2e1b] text-sm">{item.item_name}</p>
                                  <p className="text-xs text-gray-500 font-bold">🧀 {item.price}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 치즈 소비 내역 탭 */}
                {activeTab === "cheeseLogs" && (
                  <div className="space-y-4">
                    {cheeseLogs.length === 0 ? (
                      <div className="text-center py-12 text-[#a68a7e] font-bold bg-white rounded-2xl border border-[#e8dac1]">
                        치즈 사용 내역이 없습니다.
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border-2 border-[#e8dac1] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#e8dac1] bg-[#f8eedb]">
                              <th className="p-3 font-black text-[#4a2e1b]">일시</th>
                              <th className="p-3 font-black text-[#4a2e1b]">유형</th>
                              <th className="p-3 font-black text-[#4a2e1b]">사유</th>
                              <th className="p-3 font-black text-[#4a2e1b]">변동</th>
                              <th className="p-3 font-black text-[#4a2e1b]">잔액</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cheeseLogs.map((log) => (
                              <tr key={log.id} className="border-b border-[#e8dac1]/30 hover:bg-gray-50">
                                <td className="p-3 text-sm font-bold text-gray-500">
                                  {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    log.action === "earn" || log.action === "admin_grant" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                                  }`}>
                                    {log.action}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-[#4a2e1b] text-sm">
                                  {log.reason}
                                </td>
                                <td className={`p-3 font-black ${
                                  log.action === "earn" || log.action === "admin_grant" ? "text-blue-600" : "text-red-600"
                                }`}>
                                  {log.action === "earn" || log.action === "admin_grant" ? "+" : "-"}{log.amount}
                                </td>
                                <td className="p-3 font-bold text-gray-700">
                                  {log.balance_after}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
