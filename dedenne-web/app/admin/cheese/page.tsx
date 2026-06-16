"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";

export default function AdminCheesePage() {
  const supabase = createClient();

  // 1. 유저 검색 및 지급/차감 폼 상태
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [changeType, setChangeType] = useState<"admin_grant" | "admin_revoke">("admin_grant");
  const [amount, setAmount] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. 로그 조회 상태
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [logFilterType, setLogFilterType] = useState("all");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LOGS_PER_PAGE = 20;

  // --- 유저 검색 로직 ---
  const handleSearchUser = async () => {
    if (!searchUserQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, email, cheese_balance")
      .or(`email.ilike.%${searchUserQuery}%,display_name.ilike.%${searchUserQuery}%`)
      .limit(5);
    
    setSearchResults(data || []);
    setIsSearching(false);
  };

  // --- 지급/차감 로직 ---
  const handleAction = async () => {
    if (!selectedUser) return alert("유저를 선택해주세요.");
    if (!amount || amount <= 0) return alert("정상적인 수량을 입력해주세요.");
    if (!reason.trim()) return alert("관리자 메모를 반드시 입력해주세요.");

    if (!confirm(`[${selectedUser.display_name || selectedUser.email}] 님에게 ${amount} 치즈를 ${changeType === 'admin_grant' ? '지급' : '차감'} 하시겠습니까?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const currentBalance = selectedUser.cheese_balance || 0;
      const actualAmount = changeType === "admin_revoke" ? -amount : Number(amount);
      const newBalance = currentBalance + actualAmount;

      if (newBalance < 0) {
        throw new Error("치즈 잔액은 마이너스가 될 수 없습니다.");
      }

      // 1. 잔액 업데이트
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ cheese_balance: newBalance })
        .eq("id", selectedUser.id);
      
      if (profileError) throw profileError;

      // 2. 로그 인서트
      const { error: logError } = await supabase
        .from("cheese_logs")
        .insert({
          user_id: selectedUser.id,
          change_type: changeType,
          amount: actualAmount,
          balance_after: newBalance,
          reason: `[관리자 수동] ${reason}`
        });

      if (logError) throw logError;

      alert("정상적으로 처리되었습니다.");
      
      // 상태 초기화 및 갱신
      setSelectedUser({ ...selectedUser, cheese_balance: newBalance });
      setAmount("");
      setReason("");
      fetchLogs();

    } catch (err: any) {
      console.error(err);
      alert(err.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 로그 조회 로직 ---
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    
    // 카운트 쿼리
    let countQuery = supabase.from("cheese_logs").select("*", { count: "exact", head: true });
    
    if (logFilterType !== "all") {
      countQuery = countQuery.eq("change_type", logFilterType);
    }
    
    // 이메일 검색 로직 (profiles 테이블 조인 필터링이 까다로우므로 로그 쪽엔 임시로 직접 필터링은 배제하거나 inner join)
    // Supabase JS에서는 inner join 필터링이 가능: !inner
    let query = supabase
      .from("cheese_logs")
      .select(`
        *,
        profiles!inner (
          display_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (logFilterType !== "all") {
      query = query.eq("change_type", logFilterType);
    }
    if (logSearchQuery.trim() !== "") {
      query = query.ilike("profiles.email", `%${logSearchQuery}%`);
      countQuery = supabase.from("cheese_logs").select("*, profiles!inner(email)", { count: "exact", head: true })
                           .ilike("profiles.email", `%${logSearchQuery}%`);
      if (logFilterType !== "all") {
        countQuery = countQuery.eq("change_type", logFilterType);
      }
    }

    // Pagination
    const from = (currentPage - 1) * LOGS_PER_PAGE;
    const to = from + LOGS_PER_PAGE - 1;
    
    const { count } = await countQuery;
    const { data, error } = await query.range(from, to);

    if (!error && data) {
      setLogs(data);
      setTotalCount(count || 0);
    } else {
      setLogs([]);
    }
    
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, logFilterType, logSearchQuery]);

  const totalPages = Math.ceil(totalCount / LOGS_PER_PAGE) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black mb-2 text-[#4a2e1b]">치즈 관리</h2>
        <p className="text-[#a68a7e] font-medium">유저별 치즈 수동 지급/차감 및 변동 내역을 조회합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 좌측: 수동 지급/차감 폼 */}
        <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm h-fit">
          <h3 className="text-xl font-black text-[#4a2e1b] mb-4">🔧 수동 지급 및 차감</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-[#a68a7e] mb-2">대상 유저 검색 (이름 또는 이메일)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="검색어 입력..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
              />
              <button
                onClick={handleSearchUser}
                disabled={isSearching}
                className="px-4 py-3 bg-[#e8dac1] hover:bg-[#d4c5b2] text-[#4a2e1b] font-bold rounded-xl transition-colors"
              >
                검색
              </button>
            </div>
            
            {/* 검색 결과 리스트 */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="border border-[#e8dac1] rounded-xl overflow-hidden mt-2">
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => { setSelectedUser(u); setSearchResults([]); }}
                    className="px-4 py-3 bg-white hover:bg-[#f8eedb] cursor-pointer border-b border-[#e8dac1] last:border-0"
                  >
                    <p className="font-bold text-[#4a2e1b]">{u.display_name || "이름 없음"}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedUser ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#f8eedb]/50 border-2 border-[#e8dac1] rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#4a2e1b]">{selectedUser.display_name || "이름 없음"}</p>
                  <p className="text-xs text-[#a68a7e]">{selectedUser.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#a68a7e]">현재 보유</p>
                  <p className="text-xl font-black text-[#e07a5f]">🧀 {selectedUser.cheese_balance}</p>
                </div>
              </div>
              
              <button onClick={() => setSelectedUser(null)} className="text-xs text-red-500 font-bold underline mb-4 block">다른 유저 선택</button>

              <div className="flex gap-2">
                <button
                  onClick={() => setChangeType("admin_grant")}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-colors ${
                    changeType === "admin_grant" 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  [+] 지급
                </button>
                <button
                  onClick={() => setChangeType("admin_revoke")}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-colors ${
                    changeType === "admin_revoke" 
                      ? "bg-red-50 border-red-200 text-red-700" 
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  [-] 차감
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#a68a7e] mb-2">변동 수량</label>
                <input
                  type="number"
                  min="1"
                  placeholder="예: 100"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || "")}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-white text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#a68a7e] mb-2">관리자 메모 (필수)</label>
                <textarea
                  rows={2}
                  placeholder="지급/차감 사유를 기록하세요..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-white text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold resize-none"
                />
              </div>

              <button
                onClick={handleAction}
                disabled={isSubmitting}
                className="w-full py-4 bg-[#e07a5f] hover:bg-[#c44933] text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "처리 중..." : "실행하기"}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-[#a68a7e] font-bold border-2 border-dashed border-[#e8dac1] rounded-xl">
              유저를 먼저 검색해주세요.
            </div>
          )}
        </div>

        {/* 우측: 변동 로그 조회 */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm flex flex-col min-h-[600px]">
          <h3 className="text-xl font-black text-[#4a2e1b] mb-4">📖 변동 로그 원장 (Audit Trail)</h3>
          
          <div className="flex flex-col md:flex-row gap-2 mb-6">
            <select
              value={logFilterType}
              onChange={(e) => { setLogFilterType(e.target.value); setCurrentPage(1); }}
              className="px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold cursor-pointer"
            >
              <option value="all">전체 유형</option>
              <option value="charge">결제 충전 (charge)</option>
              <option value="spend">아이템 구매 (spend)</option>
              <option value="admin_grant">관리자 지급 (admin_grant)</option>
              <option value="admin_revoke">관리자 차감 (admin_revoke)</option>
            </select>
            <input
              type="text"
              placeholder="이메일 검색..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setCurrentPage(1)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
            />
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-[#e8dac1] text-[#a68a7e]">
                  <th className="p-3 font-black text-sm">일시</th>
                  <th className="p-3 font-black text-sm">유저</th>
                  <th className="p-3 font-black text-sm text-center">유형</th>
                  <th className="p-3 font-black text-sm text-right">변동 수량</th>
                  <th className="p-3 font-black text-sm text-right">잔액</th>
                  <th className="p-3 font-black text-sm">메모</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingLogs ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#a68a7e] font-bold">
                      로그를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#a68a7e] font-bold">
                      내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#e8dac1]/50 hover:bg-[#f8eedb]/30">
                      <td className="p-3 text-xs text-gray-500 font-bold whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-sm font-bold text-[#4a2e1b]">
                        {log.profiles?.email || "알 수 없음"}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-black ${
                          log.change_type === 'charge' ? 'bg-green-100 text-green-700' :
                          log.change_type === 'spend' ? 'bg-purple-100 text-purple-700' :
                          log.change_type === 'admin_grant' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.change_type}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-black ${log.amount > 0 ? "text-blue-600" : "text-red-600"}`}>
                        {log.amount > 0 ? "+" : ""}{log.amount}
                      </td>
                      <td className="p-3 text-right font-bold text-[#a68a7e]">
                        {log.balance_after}
                      </td>
                      <td className="p-3 text-xs text-gray-600 max-w-[200px] truncate" title={log.reason}>
                        {log.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {!isLoadingLogs && totalPages > 1 && (
            <div className="flex justify-center flex-wrap gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg font-bold transition-colors text-sm ${
                    currentPage === i + 1
                      ? "bg-[#e07a5f] text-white"
                      : "bg-[#f8eedb] text-[#4a2e1b] hover:bg-[#e8dac1]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
