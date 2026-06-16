"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ItemData = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  emoji: string;
  stock: number;
  sales?: number;
};

type ItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ItemData, isEdit: boolean) => void;
  initialData?: ItemData | null;
};

export default function ItemModal({ isOpen, onClose, onSubmit, initialData }: ItemModalProps) {
  const [formData, setFormData] = useState<ItemData>({
    id: "",
    name: "",
    category: "식품",
    description: "",
    price: 0,
    emoji: "",
    stock: -1,
  });

  const isEdit = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          price: initialData.price ?? 0,
          stock: initialData.stock ?? -1,
        });
      } else {
        setFormData({
          id: "",
          name: "",
          category: "식품",
          description: "",
          price: 0,
          emoji: "",
          stock: -1,
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, isEdit);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#fdf6e3] rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto border-4 border-[#e8dac1] shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-[#4a2e1b]">
                {isEdit ? "아이템 수정" : "새 아이템 추가"}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e8dac1] text-[#4a2e1b] hover:bg-[#d4c5b2] transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#a68a7e] mb-1">아이템 ID</label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    disabled={isEdit}
                    required
                    placeholder="ex) bread"
                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e8dac1] bg-white text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#a68a7e] mb-1">이모지/에셋 경로</label>
                  <input
                    type="text"
                    name="emoji"
                    value={formData.emoji}
                    onChange={handleChange}
                    required
                    placeholder="ex) 🍞"
                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e8dac1] bg-white text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#a68a7e] mb-1">아이템명</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="ex) 맛있는 식빵"
                  className="w-full px-4 py-2 rounded-xl border-2 border-[#e8dac1] bg-white text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#a68a7e] mb-1">카테고리</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border-2 border-[#e8dac1] bg-white text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f]"
                >
                  <option value="식품">식품</option>
                  <option value="생활용품">생활용품</option>
                  <option value="펫">펫</option>
                  <option value="의상">의상</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#a68a7e] mb-1">설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="아이템 설명을 입력하세요."
                  className="w-full px-4 py-2 rounded-xl border-2 border-[#e8dac1] bg-white text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#a68a7e] mb-1">가격 (치즈)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e8dac1] bg-white text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#a68a7e] mb-1">재고 (-1=무제한)</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="-1"
                    required
                    className="w-full px-4 py-2 rounded-xl border-2 border-[#e8dac1] bg-white text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f]"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-[#e8dac1] text-[#4a2e1b] hover:bg-[#d4c5b2] font-bold rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#e07a5f] text-white hover:bg-[#c44933] font-bold rounded-xl transition-colors shadow-sm"
                >
                  저장하기
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
