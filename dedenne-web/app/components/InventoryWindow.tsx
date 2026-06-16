"use client";

import React, { useEffect, useState, useCallback } from "react";

const ITEMS: Record<string, { name: string; emoji: string; affectionGain: number; message: string }> = {
  bread:      { name: "맛있는 식빵",   emoji: "🍞", affectionGain: 10, message: "냠냠~ 맛있다!" },
  strawberry: { name: "상큼한 딸기",   emoji: "🍓", affectionGain: 15, message: "달콤해~!" },
  soap:       { name: "몽글몽글 비누", emoji: "🧼", affectionGain: 5,  message: "깨끗해졌어!" },
  towel:      { name: "부드러운 수건", emoji: "🧻", affectionGain: 5,  message: "뽀송뽀송!" },
};

interface InventoryWindowProps {
  onClose: () => void;
  onUseItem: (itemId: string, affectionGain: number, message: string) => void;
}

export default function InventoryWindow({ onClose, onUseItem }: InventoryWindowProps) {
  const [petData, setPetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if ((window as any).electronAPI?.loadPetData) {
      const data = await (window as any).electronAPI.loadPetData();
      setPetData(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const useItem = async (itemId: string) => {
    if (!petData) return;
    const item = ITEMS[itemId];
    const qty = petData.inventory?.[itemId] ?? 0;
    if (qty <= 0) return;

    const newInventory = { ...petData.inventory, [itemId]: qty - 1 };
    let newAffection = (petData.affection ?? 0) + item.affectionGain;
    let newLevel = petData.level ?? 1;
    let leveledUp = false;

    if (newAffection >= 100) {
      newLevel += 1;
      newAffection = 0;
      leveledUp = true;
    }

    const today = new Date().toISOString().slice(0, 10);
    const newData = {
      ...petData,
      affection: newAffection,
      level: newLevel,
      inventory: newInventory,
      last_pat_date: petData.last_pat_date
    };

    setPetData(newData);

    if ((window as any).electronAPI?.savePetData) {
      await (window as any).electronAPI.savePetData(newData);
    }

    onUseItem(itemId, item.affectionGain, leveledUp ? `🎉 레벨 ${newLevel} 달성!` : item.message);
  };

  if (loading) {
    return (
      <div className="fixed top-20 right-8 w-72 bg-[#fdf6e3] border-4 border-[#4a3525] rounded-2xl p-5 z-[99999] shadow-2xl font-['Malgun_Gothic',sans-serif]">
        <p className="text-center text-[#4a2e1b] font-bold">불러오는 중...</p>
      </div>
    );
  }

  const affection = petData?.affection ?? 0;
  const level = petData?.level ?? 1;
  const inventory = petData?.inventory ?? {};

  return (
    <div
      className="fixed top-20 right-8 w-72 bg-[#fdf6e3] border-4 border-[#4a3525] rounded-2xl shadow-2xl z-[99999]"
      style={{ fontFamily: "'Malgun Gothic', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#e8dac1]">
        <span className="text-[#4a2e1b] font-black text-lg">🎒 내 가방</span>
        <button
          onClick={onClose}
          className="text-[#a68a7e] hover:text-[#4a2e1b] font-black text-xl leading-none"
        >
          ✖
        </button>
      </div>

      {/* Affection Bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex justify-between text-xs font-bold text-[#a68a7e] mb-1">
          <span>Lv.{level}</span>
          <span>❤️ {affection} / 100</span>
        </div>
        <div className="w-full h-4 bg-[#e8dac1] rounded-full overflow-hidden border border-[#d0b8a0]">
          <div
            className="h-full bg-gradient-to-r from-[#e07a5f] to-[#f4a58a] rounded-full transition-all duration-500"
            style={{ width: `${affection}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {Object.entries(ITEMS).map(([id, item]) => {
          const qty = inventory[id] ?? 0;
          return (
            <div key={id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-[#4a2e1b] font-bold text-sm leading-tight">{item.name}</p>
                  <p className="text-[#a68a7e] text-xs">{qty}개 보유</p>
                </div>
              </div>
              <button
                onClick={() => useItem(id)}
                disabled={qty <= 0}
                className="px-3 py-1.5 bg-[#e07a5f] hover:bg-[#c44933] disabled:bg-[#e8dac1] disabled:text-[#a68a7e] text-white disabled:cursor-not-allowed rounded-lg text-xs font-black transition-colors"
              >
                사용하기
              </button>
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-3 pt-1 border-t-2 border-[#e8dac1]">
        <p className="text-center text-xs text-[#a68a7e] font-bold">
          💡 아이템은 웹 상점에서 구매할 수 있어요!
        </p>
      </div>
    </div>
  );
}
