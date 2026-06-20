"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import ExportModal from "./components/ExportModal";

export default function AdminStatsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Summary Metrics
  const [metrics, setMetrics] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0
  });

  // Chart Data
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);

    try {
      // 1. Fetch completed orders (remove gte 1000 to include recent cheese-based prices)
      const { data: orders } = await supabase
        .from("orders")
        .select("ordered_at, total_price")
        .eq("status", "completed");

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      let tToday = 0, tWeek = 0, tMonth = 0, tTotal = 0;
      
      // Monthly aggregation
      const monthlyMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(thisYear, thisMonth - i, 1);
        const monthKey = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap[monthKey] = 0;
      }

      orders?.forEach((o) => {
        const d = new Date(o.ordered_at);
        const dStr = o.ordered_at.split("T")[0];
        // Handle mixed DB values: old ones are KRW (>= 1000), new ones are Cheese (< 1000). 1 Cheese = 1000 KRW.
        let rawVal = o.total_price || 0;
        const val = rawVal < 1000 ? rawVal * 1000 : rawVal;

        tTotal += val;
        if (dStr === todayStr) tToday += val;
        if (d >= oneWeekAgo) tWeek += val;
        if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) tMonth += val;

        const mKey = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyMap[mKey] !== undefined) {
          monthlyMap[mKey] += val;
        }
      });

      setMetrics({ today: tToday, week: tWeek, month: tMonth, total: tTotal });
      
      setMonthlyData(
        Object.entries(monthlyMap).map(([name, total]) => ({ name, total }))
      );

      // 2. Fetch order items for Top 10 and Category chart
      // Note: In a large db, you'd aggregate this on the server via RPC.
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`
          item_id,
          item_name,
          price,
          orders!inner(status),
          items(category)
        `)
        .eq("orders.status", "completed");

      if (orderItems) {
        const itemStats: Record<string, { name: string, category: string, count: number, revenue: number }> = {};
        const catStats: Record<string, number> = {
          pet: 0, food: 0, toy: 0, apparel: 0, special: 0, unknown: 0
        };

        orderItems.forEach((oi: any) => {
          const cat = oi.items?.category || "unknown";
          
          if (catStats[cat] !== undefined) catStats[cat] += 1;
          else catStats[cat] = 1;

          if (!itemStats[oi.item_id]) {
            itemStats[oi.item_id] = {
              name: oi.item_name || oi.item_id,
              category: cat,
              count: 0,
              revenue: 0
            };
          }
          itemStats[oi.item_id].count += 1;
          itemStats[oi.item_id].revenue += oi.price;
        });

        // Top 10
        const sortedItems = Object.values(itemStats)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setTopItems(sortedItems);

        // Category formatting
        const catMap = {
          pet: "펫", food: "음식", toy: "소품", apparel: "의상", special: "기타", unknown: "미분류"
        };
        const pieData = Object.entries(catStats)
          .filter(([_, value]) => value > 0)
          .map(([key, value]) => ({
            name: catMap[key as keyof typeof catMap] || key,
            value
          }));
        setCategoryData(pieData);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ["#e07a5f", "#f2cc8f", "#81b29a", "#3d405b", "#d4c5b2"];

  if (isLoading) {
    return <div className="p-12 text-center text-xl font-bold text-[#a68a7e]">정산 데이터를 분석 중입니다...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black mb-2 text-[#4a2e1b]">정산 및 매출 현황</h2>
          <p className="text-[#a68a7e] font-medium">전체 매출 흐름을 파악하고 정산 데이터를 엑셀로 추출합니다.</p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="bg-[#4a2e1b] hover:bg-[#2b190f] text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors"
        >
          📄 정산 데이터 다운로드
        </button>
      </div>

      {/* 1. 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm">
          <p className="text-[#a68a7e] font-bold text-sm mb-1">오늘 매출</p>
          <div className="text-3xl font-black text-[#e07a5f]">₩ {metrics.today.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm">
          <p className="text-[#a68a7e] font-bold text-sm mb-1">최근 7일 매출</p>
          <div className="text-3xl font-black text-[#4a2e1b]">₩ {metrics.week.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm">
          <p className="text-[#a68a7e] font-bold text-sm mb-1">이번 달 매출</p>
          <div className="text-3xl font-black text-[#81b29a]">₩ {metrics.month.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm">
          <p className="text-[#a68a7e] font-bold text-sm mb-1">총 누적 매출</p>
          <div className="text-3xl font-black text-[#f2cc8f]">₩ {metrics.total.toLocaleString()}</div>
        </div>
      </div>

      {/* 2. 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 월별 차트 */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm">
          <h3 className="text-xl font-black text-[#4a2e1b] mb-6">최근 6개월 매출 추이</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{fill: '#a68a7e', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#a68a7e'}} axisLine={false} tickLine={false} tickFormatter={(v) => `₩${v}`} />
                <Tooltip 
                  cursor={{fill: '#f8eedb'}}
                  contentStyle={{borderRadius: '1rem', border: '2px solid #e8dac1', fontWeight: 'bold', color: '#4a2e1b'}} 
                />
                <Bar dataKey="total" fill="#f2cc8f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 카테고리 파이 차트 */}
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-[#4a2e1b] mb-2">카테고리별 판매 건수</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '1rem', border: '2px solid #e8dac1', fontWeight: 'bold'}} 
                />
                <Legend iconType="circle" wrapperStyle={{fontWeight: 'bold', fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. 인기 아이템 TOP 10 */}
      <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm mb-12">
        <h3 className="text-xl font-black text-[#4a2e1b] mb-6">🏆 인기 아이템 TOP 10</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-[#e8dac1] text-[#a68a7e]">
                <th className="p-4 font-black">순위</th>
                <th className="p-4 font-black">아이템명</th>
                <th className="p-4 font-black text-center">카테고리</th>
                <th className="p-4 font-black text-right">총 판매 수량</th>
                <th className="p-4 font-black text-right">매출 합계</th>
              </tr>
            </thead>
            <tbody>
              {topItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#a68a7e] font-bold">
                    판매된 아이템이 없습니다.
                  </td>
                </tr>
              ) : (
                topItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#e8dac1]/30 hover:bg-[#f8eedb]/30 transition-colors">
                    <td className="p-4 font-black text-[#e07a5f] text-lg">{idx + 1}</td>
                    <td className="p-4 font-bold text-[#4a2e1b]">{item.name}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-3 py-1 bg-[#f8eedb] text-[#a68a7e] font-bold text-xs rounded-full uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 font-black text-gray-600 text-right">{item.count} 건</td>
                    <td className="p-4 font-black text-[#e07a5f] text-right">₩ {(item.revenue * 1000).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
}
