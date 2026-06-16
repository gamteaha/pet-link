"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import ItemModal, { ItemData } from "./components/ItemModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

export default function AdminItemsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCategory, setSortCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemData | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ItemData | null>(null);
  const [referenceCount, setReferenceCount] = useState(0);

  // Fetch Items
  const fetchItems = async () => {
    setIsLoading(true);
    let query = supabase.from("items").select("*");
    
    if (sortCategory !== "all") {
      query = query.eq("category", sortCategory);
    }
    
    if (searchQuery.trim() !== "") {
      query = query.ilike("name", `%${searchQuery}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (!error && data) {
      setItems(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [sortCategory, searchQuery]);

  // Derived state for pagination
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item: ItemData) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleItemSubmit = async (data: ItemData, isEdit: boolean) => {
    if (isEdit) {
      // id, sales, created_at 등 읽기전용 필드 제외하고 편집 가능한 컬럼만 전송
      const { name, category, description, price, emoji, stock } = data;
      const { error } = await supabase
        .from("items")
        .update({ name, category, description, price, emoji, stock })
        .eq("id", data.id);
      if (error) alert("수정에 실패했습니다.");
    } else {
      const { error } = await supabase.from("items").insert(data);
      if (error) {
        if (error.code === "23505") alert("이미 존재하는 아이템 ID입니다.");
        else alert("추가에 실패했습니다.");
      }
    }
    setIsItemModalOpen(false);
    fetchItems();
  };

  const handleOpenDeleteModal = async (item: ItemData) => {
    setDeletingItem(item);
    // Check references
    const { count: orderCount } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("item_id", item.id);
      
    const { count: invCount } = await supabase
      .from("user_inventory")
      .select("*", { count: "exact", head: true })
      .eq("item_id", item.id);

    setReferenceCount((orderCount || 0) + (invCount || 0));
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    const { error } = await supabase.from("items").delete().eq("id", deletingItem.id);
    if (error) alert("삭제에 실패했습니다. (외래키 제약조건 위반일 수 있습니다)");
    setIsDeleteModalOpen(false);
    setDeletingItem(null);
    fetchItems();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black mb-2 text-[#4a2e1b]">상점 아이템 관리</h2>
          <p className="text-[#a68a7e] font-medium">상점의 아이템을 추가하고 수정할 수 있습니다.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#e07a5f] hover:bg-[#c44933] text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors"
        >
          + 새 아이템 추가
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border-2 border-[#e8dac1] p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="아이템명 검색..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
          />
          <select
            value={sortCategory}
            onChange={(e) => {
              setSortCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-48 px-4 py-3 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold cursor-pointer"
          >
            <option value="all">전체 카테고리</option>
            <option value="식품">식품</option>
            <option value="생활용품">생활용품</option>
            <option value="펫">펫</option>
            <option value="의상">의상</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-[#e8dac1] text-[#a68a7e]">
                <th className="p-4 font-black">ID</th>
                <th className="p-4 font-black">아이템</th>
                <th className="p-4 font-black">카테고리</th>
                <th className="p-4 font-black">가격</th>
                <th className="p-4 font-black">재고</th>
                <th className="p-4 font-black">판매량</th>
                <th className="p-4 font-black text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#a68a7e] font-bold">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#a68a7e] font-bold">
                    표시할 아이템이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#e8dac1]/50 hover:bg-[#f8eedb]/30 transition-colors">
                    <td className="p-4 font-bold text-sm text-gray-500">{item.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{item.emoji}</span>
                        <div>
                          <p className="font-bold text-[#4a2e1b]">{item.name}</p>
                          <p className="text-xs text-[#a68a7e] truncate max-w-[200px]">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-[#e07a5f]">
                      {item.category.toUpperCase()}
                    </td>
                    <td className="p-4 font-black text-[#4a2e1b]">🧀 {item.price}</td>
                    <td className="p-4 font-bold text-gray-600">
                      {item.stock === -1 ? "무제한" : item.stock}
                    </td>
                    <td className="p-4 font-bold text-gray-600">
                      {item.sales || 0}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="px-3 py-1.5 bg-[#e8dac1] hover:bg-[#d4c5b2] text-[#4a2e1b] font-bold text-sm rounded-lg transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(item)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 font-bold text-sm rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-bold transition-colors ${
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

      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSubmit={handleItemSubmit}
        initialData={editingItem}
      />

      {deletingItem && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          itemName={deletingItem.name}
          referenceCount={referenceCount}
        />
      )}
    </div>
  );
}
