"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import OrderRow from "./components/OrderRow";
import { exportCsv } from "./utils/exportCsv";

export default function AdminOrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = async () => {
    setIsLoading(true);
    let query = supabase
      .from("orders")
      .select("*")
      .order("ordered_at", { ascending: false });

    // Apply DB-level filters if possible
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (startDate) {
      query = query.gte("ordered_at", new Date(startDate).toISOString());
    }
    if (endDate) {
      // Include the whole end date up to 23:59:59
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte("ordered_at", end.toISOString());
    }

    const { data, error } = await query;
    if (!error && data) {
      // Manually fetch profiles since there is no formal FK relationship
      const userIds = Array.from(new Set(data.map(o => o.user_id).filter(Boolean)));
      let profileMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", userIds);
          
        if (profiles) {
          profiles.forEach(p => {
            profileMap[p.id] = p;
          });
        }
      }

      // Attach profile data manually and normalize total_price
      const ordersWithProfiles = data.map(o => ({
        ...o,
        total_price: o.total_price < 1000 ? o.total_price * 1000 : o.total_price,
        profiles: profileMap[o.user_id] || null
      }));

      // Client-side filter for user name
      let filteredData = ordersWithProfiles;
      if (searchQuery.trim() !== "") {
        const lowerQ = searchQuery.toLowerCase();
        filteredData = ordersWithProfiles.filter((o) => {
          const name = (o.profiles?.display_name || "").toLowerCase();
          const email = (o.profiles?.email || "").toLowerCase();
          return name.includes(lowerQ) || email.includes(lowerQ) || o.user_id?.toLowerCase().includes(lowerQ);
        });
      }
      setOrders(filteredData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate, statusFilter, searchQuery]);

  const handleExportCsv = () => {
    const exportData = orders.map((o) => ({
      "주문번호": o.id,
      "유저명": o.profiles?.display_name || o.profiles?.email || "알 수 없음",
      "주문일시": new Date(o.ordered_at).toLocaleString(),
      "총 아이템 수량": o.total_items,
      "총 결제 금액": o.total_price,
      "상태": o.status === "completed" ? "결제완료" : o.status === "cancelled" ? "주문취소" : o.status
    }));
    exportCsv(exportData, `orders_${new Date().getTime()}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black mb-2 text-[#4a2e1b]">결제 및 매출 내역 조회</h2>
          <p className="text-[#a68a7e] font-medium">유저들의 치즈 충전(실제 결제) 내역을 상세히 조회합니다.</p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={orders.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors disabled:opacity-50"
        >
          📥 엑셀(CSV) 다운로드
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm mb-6">
        {/* 필터 영역 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
            />
            <span className="font-black text-[#a68a7e]">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold cursor-pointer"
          >
            <option value="all">전체 상태</option>
            <option value="completed">결제완료</option>
            <option value="cancelled">주문취소</option>
          </select>

          <input
            type="text"
            placeholder="유저명/이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
          />
        </div>

        {/* 테이블 영역 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-[#e8dac1] text-[#a68a7e]">
                <th className="p-4 font-black">주문번호</th>
                <th className="p-4 font-black">유저명</th>
                <th className="p-4 font-black">주문일시</th>
                <th className="p-4 font-black text-center">결제 치즈</th>
                <th className="p-4 font-black">총 금액 (₩)</th>
                <th className="p-4 font-black">상태 변경</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#a68a7e] font-bold">
                    주문 내역을 불러오는 중입니다...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#a68a7e] font-bold">
                    조건에 일치하는 주문 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <OrderRow 
                    key={order.id} 
                    order={order} 
                    onStatusChange={fetchOrders}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
