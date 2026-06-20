"use client";

import React, { useEffect, useState } from "react";
import { getAdminLogsData } from "../actions";

type TableStat = {
  icon: string;
  label: string;
  table: string;
  color: string;
  count: number | null;
};

type ActivityItem = {
  type: "signup" | "order" | "cheese" | "pet";
  label: string;
  detail: string;
  time: string;
  icon: string;
  color: string;
};

export default function AdminLogsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [tableStats, setTableStats] = useState<TableStat[]>([
    { icon: "👥", label: "가입 유저", table: "profiles", color: "bg-blue-50 text-blue-600 border-blue-200", count: null },
    { icon: "📦", label: "전체 주문", table: "orders", color: "bg-green-50 text-green-600 border-green-200", count: null },
    { icon: "🛍️", label: "주문 품목", table: "order_items", color: "bg-purple-50 text-purple-600 border-purple-200", count: null },
    { icon: "🏪", label: "등록 아이템", table: "items", color: "bg-orange-50 text-orange-600 border-orange-200", count: null },
    { icon: "🎒", label: "인벤토리 기록", table: "user_inventory", color: "bg-pink-50 text-pink-600 border-pink-200", count: null },
    { icon: "🧀", label: "치즈 변동 로그", table: "cheese_logs", color: "bg-amber-50 text-amber-600 border-amber-200", count: null },
  ]);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [dbStatus, setDbStatus] = useState<"ok" | "error" | "checking">("checking");

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminLogsData();
      
      setDbStatus(data.dbStatus);
      
      setTableStats((prev) =>
        prev.map((stat, i) => ({ ...stat, count: data.tableStats[i] ?? 0 }))
      );

      setActivities(data.activities);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
      setDbStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black mb-2 text-[#4a2e1b]">시스템 로그 및 데이터베이스</h2>
          <p className="text-[#a68a7e] font-medium">DB 현황 및 최근 서비스 활동 타임라인을 모니터링합니다.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              dbStatus === "ok" ? "bg-green-500 animate-pulse" :
              dbStatus === "error" ? "bg-red-500" : "bg-yellow-400 animate-pulse"
            }`} />
            <span className={`text-sm font-bold ${
              dbStatus === "ok" ? "text-green-600" :
              dbStatus === "error" ? "text-red-600" : "text-yellow-600"
            }`}>
              Supabase {dbStatus === "ok" ? "연결됨" : dbStatus === "error" ? "연결 오류" : "확인 중"}
            </span>
          </div>
          <button
            onClick={fetchAll}
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#4a2e1b] hover:bg-[#2b190f] text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? "새로고침 중..." : "🔄 새로고침"}
          </button>
        </div>
      </div>

      <p className="text-xs text-[#a68a7e] font-bold -mt-4">
        마지막 갱신: {lastRefreshed.toLocaleString()}
      </p>

      {/* DB 현황 카드 */}
      <div>
        <h3 className="text-xl font-black text-[#4a2e1b] mb-4">📊 DB 테이블 현황</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tableStats.map((stat) => (
            <div
              key={stat.table}
              className={`bg-white rounded-2xl border-2 p-5 shadow-sm flex flex-col gap-2 ${stat.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-xs font-bold opacity-60">{stat.table}</span>
              </div>
              <div className="text-3xl font-black">
                {isLoading ? (
                  <span className="text-gray-300">...</span>
                ) : (
                  stat.count?.toLocaleString() ?? "오류"
                )}
              </div>
              <div className="text-sm font-bold opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 활동 타임라인 */}
      <div>
        <h3 className="text-xl font-black text-[#4a2e1b] mb-4">🕐 최근 활동 타임라인</h3>
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm">
          {isLoading ? (
            <div className="text-center py-12 text-[#a68a7e] font-bold">데이터 불러오는 중...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-[#a68a7e] font-bold">최근 활동 내역이 없습니다.</div>
          ) : (
            <div className="relative">
              {/* 수직선 */}
              <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-[#e8dac1]" />

              <div className="space-y-4">
                {activities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 pl-2">
                    {/* 타임라인 아이콘 */}
                    <div className={`relative z-10 w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-sm ${item.color} border-2 border-white shadow`}>
                      {item.icon}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div>
                          <span className={`inline-block text-xs font-black px-2 py-0.5 rounded ${item.color} mr-2`}>
                            {item.label}
                          </span>
                          <span className="text-sm font-bold text-[#4a2e1b] truncate">{item.detail}</span>
                        </div>
                        <span className="text-xs text-[#a68a7e] font-bold whitespace-nowrap">
                          {new Date(item.time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
