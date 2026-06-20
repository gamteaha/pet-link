"use client";

import React, { useEffect, useState } from "react";
import UserDetailModal from "./components/UserDetailModal";
import { getAdminUsers } from "../actions";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminUsers(searchQuery);
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black mb-2 text-[#4a2e1b]">유저 및 캐릭터 데이터 관리</h2>
          <p className="text-[#a68a7e] font-medium">전체 회원 목록과 상세 인벤토리/결제 내역을 조회합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm mb-6">
        {/* 필터 영역 */}
        <div className="flex mb-6">
          <input
            type="text"
            placeholder="유저명 또는 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
          />
        </div>

        {/* 테이블 영역 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-[#e8dac1] text-[#a68a7e]">
                <th className="p-4 font-black">유저 정보</th>
                <th className="p-4 font-black">가입 일시</th>
                <th className="p-4 font-black text-center">대표 캐릭터</th>
                <th className="p-4 font-black text-center">아이템 구매 횟수</th>
                <th className="p-4 font-black">총 결제 금액</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#a68a7e] font-bold">
                    회원 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#a68a7e] font-bold">
                    일치하는 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => handleOpenModal(user)}
                    className="border-b border-[#e8dac1]/50 hover:bg-[#f8eedb]/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <p className="font-bold text-[#4a2e1b] text-lg">{user.display_name || "이름 없음"}</p>
                      <p className="text-sm text-gray-500 font-bold">{user.email || "이메일 없음"}</p>
                    </td>
                    <td className="p-4 text-sm font-bold text-[#a68a7e]">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex w-10 h-10 bg-[#f8eedb] rounded-full items-center justify-center text-xl shadow-sm border border-[#e8dac1]">
                        {user.main_pet === "dedenne" ? "🐭" 
                         : user.main_pet === "cat" ? "🐱" 
                         : user.main_pet === "dog" ? "🐶"
                         : user.main_pet === "pig" ? "🐷"
                         : user.main_pet === "horse" ? "🐴"
                         : user.main_pet === "chick" ? "🐥"
                         : user.main_pet === "chicken" ? "🐔"
                         : user.main_pet === "raccoon" ? "🦝"
                         : user.main_pet === "blue-tang" ? "🐟"
                         : user.main_pet === "human" ? "🧑‍🌾" 
                         : "🐾"}
                      </div>
                    </td>
                    <td className="p-4 font-black text-gray-600 text-center text-lg">
                      {user.order_count}
                    </td>
                    <td className="p-4 font-black text-[#e07a5f] text-lg">
                      ₩ {user.total_spent.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}
