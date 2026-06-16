"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../utils/supabase/client";

export default function AdminPage() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalPets: 0,
    monthRevenue: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // 1. 전체 유저 수 (profiles 테이블)
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // 2. 전체 캐릭터 수 (user_inventory에서 dedenne, cat, human)
        const { count: petsCount, error: petsErr } = await supabase
          .from("user_inventory")
          .select("*", { count: "exact", head: true })
          .in("item_id", ["dedenne", "cat", "human"]);
        
        if (petsErr) console.error("Pets count error:", petsErr);

        // 3. 총 누적 매출 (진짜 돈, total_price >= 1000)
        const { data: totalRevData, error: totalErr } = await supabase
          .from("orders")
          .select("total_price")
          .eq("status", "completed")
          .gte("total_price", 1000);
        
        if (totalErr) console.error("Total revenue error:", totalErr);
        const totalRevenue = totalRevData?.reduce((sum, row) => sum + (row.total_price || 0), 0) || 0;

        // 4. 이번 달 총 매출 (진짜 돈, total_price >= 1000)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const { data: revenueData, error: revErr } = await supabase
          .from("orders")
          .select("total_price")
          .eq("status", "completed")
          .gte("total_price", 1000)
          .gte("ordered_at", firstDayOfMonth.toISOString());
        
        if (revErr) console.error("Month revenue error:", revErr);
        
        const monthRevenue = revenueData?.reduce((sum, row) => sum + (row.total_price || 0), 0) || 0;

        setMetrics({
          totalUsers: usersCount || 0,
          totalPets: petsCount || 0,
          monthRevenue: monthRevenue,
          totalRevenue: totalRevenue,
        });
      } catch (error) {
        console.error("Failed to fetch admin metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [supabase]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black mb-2 text-[#4a2e1b]">대시보드</h2>
        <p className="text-[#a68a7e] font-medium">Pet-Link 전체 운영 현황을 한눈에 파악하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 전체 유저 수 */}
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-[#4a2e1b]">전체 유저 수</h3>
          </div>
          <p className="text-[#a68a7e] text-sm">등록된 전체 회원 수</p>
          <div className="mt-4 text-4xl font-black text-[#e07a5f]">
            {loading ? "..." : `${metrics.totalUsers.toLocaleString()} 명`}
          </div>
        </div>

        {/* 전체 캐릭터 수 */}
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 text-yellow-500 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🐾</span>
            </div>
            <h3 className="text-xl font-bold text-[#4a2e1b]">전체 캐릭터 수</h3>
          </div>
          <p className="text-[#a68a7e] text-sm">입양된 전체 캐릭터 수</p>
          <div className="mt-4 text-4xl font-black text-[#e07a5f]">
            {loading ? "..." : `${metrics.totalPets.toLocaleString()} 마리`}
          </div>
        </div>

        {/* 이번 달 총 매출 */}
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-xl font-bold text-[#4a2e1b]">이번 달 매출</h3>
          </div>
          <p className="text-[#a68a7e] text-sm">이번 달 총 결제 금액</p>
          <div className="mt-4 text-4xl font-black text-[#e07a5f]">
            {loading ? "..." : `₩ ${metrics.monthRevenue.toLocaleString()}`}
          </div>
        </div>

        {/* 총 누적 매출 */}
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 text-green-500 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-[#4a2e1b]">총 누적 매출</h3>
          </div>
          <p className="text-sm text-[#a68a7e] mb-4">전체 누적 결제액</p>
          <div className="mt-4 text-4xl font-black text-[#e07a5f]">
            {loading ? "..." : `₩ ${metrics.totalRevenue.toLocaleString()}`}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-4 text-[#4a2e1b]">관리자 기능 (준비 중)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users" className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all cursor-pointer block">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-[#4a2e1b]">회원 관리</h3>
            </div>
            <p className="text-[#a68a7e] text-sm mb-4">등록된 회원 목록 조회 및 관리</p>
            <div className="text-right text-[#e07a5f] font-bold">바로가기 &rarr;</div>
          </Link>

          <Link href="/admin/cheese" className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all cursor-pointer block">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🧀</span>
              </div>
              <h3 className="text-xl font-bold text-[#4a2e1b]">치즈 관리</h3>
            </div>
            <p className="text-[#a68a7e] text-sm mb-4">치즈 지급/차감 및 변동 내역 조회</p>
            <div className="text-right text-[#e07a5f] font-bold">바로가기 &rarr;</div>
          </Link>

          <Link href="/admin/orders" className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all cursor-pointer block">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 text-green-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-bold text-[#4a2e1b]">주문 내역</h3>
            </div>
            <p className="text-[#a68a7e] text-sm mb-4">전체 주문 및 결제 내역 관리</p>
            <div className="text-right text-[#e07a5f] font-bold">바로가기 &rarr;</div>
          </Link>

          <Link href="/admin/items" className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all cursor-pointer block">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🛍️</span>
              </div>
              <h3 className="text-xl font-bold text-[#4a2e1b]">상점 관리</h3>
            </div>
            <p className="text-[#a68a7e] text-sm mb-4">상점 아이템 등록 및 수정</p>
            <div className="text-right text-[#e07a5f] font-bold">바로가기 &rarr;</div>
          </Link>

          <Link href="/admin/stats" className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all cursor-pointer block">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-[#4a2e1b]">통계</h3>
            </div>
            <p className="text-[#a68a7e] text-sm mb-4">매출 및 사용자 통계 대시보드</p>
            <div className="text-right text-[#e07a5f] font-bold">바로가기 &rarr;</div>
          </Link>

          <Link href="/admin/logs" className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm hover:border-[#e07a5f] hover:shadow-lg transition-all cursor-pointer block">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">🖥️</span>
              </div>
              <h3 className="text-xl font-bold text-[#4a2e1b]">시스템 로그</h3>
            </div>
            <p className="text-[#a68a7e] text-sm mb-4">DB 현황 및 최근 활동 타임라인</p>
            <div className="text-right text-[#e07a5f] font-bold">바로가기 &rarr;</div>
          </Link>
        </div>
    </div>
    </div>
  );
}
