"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import DraggableItem from "./DraggableItem";
import { createClient } from "../../utils/supabase/client";
import { useAuth } from "../../context/AuthContext";

export type InventoryPopupProps = {
  position: { x: number; y: number };
  onClose: () => void;
  // trigger refresh when an item is consumed
  refreshTrigger?: number;
};

const ITEMS: Record<string, { name: string; emoji: string }> = {
  bread: { name: "맛있는 식빵", emoji: "🍞" },
  strawberry: { name: "상큼한 딸기", emoji: "🍓" },
  soap: { name: "몽글몽글 비누", emoji: "🧼" },
  towel: { name: "부드러운 수건", emoji: "🧻" },
};

export default function InventoryPopup({ position, onClose, refreshTrigger }: InventoryPopupProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Add small delay to prevent immediate close if triggered by click
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Load Inventory
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id)
        .in('item_id', Object.keys(ITEMS));

      const invMap: Record<string, number> = {};
      Object.keys(ITEMS).forEach(k => { invMap[k] = 0; }); // initialize all
      
      if (data) {
        data.forEach(row => {
          invMap[row.item_id] = row.quantity;
        });
      }
      setInventory(invMap);
      setIsLoading(false);
    };

    fetchInventory();
  }, [user, supabase, refreshTrigger]);

  // Keep within screen bounds
  const safePosition = { ...position };
  if (typeof window !== "undefined") {
    // estimated popup width 250, height 350
    if (safePosition.x + 250 > window.innerWidth) {
      safePosition.x = window.innerWidth - 260;
    }
    if (safePosition.y + 350 > window.innerHeight) {
      safePosition.y = window.innerHeight - 360;
    }
  }

  const content = (
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: Math.max(10, safePosition.y),
        left: Math.max(10, safePosition.x),
        zIndex: 9999,
      }}
      className="w-64 bg-white rounded-2xl shadow-2xl border-4 border-[#e8dac1] overflow-hidden animate-fade-in"
      onContextMenu={(e) => e.preventDefault()} // prevent context menu over the menu itself
    >
      <div className="bg-[#f8eedb] p-4 border-b-2 border-[#e8dac1] flex justify-between items-center">
        <h3 className="font-black text-[#4a2e1b] flex items-center gap-2">
          🎒 내 가방
        </h3>
        <button 
          onClick={onClose}
          className="text-[#a68a7e] hover:text-[#e07a5f] font-black w-6 h-6 flex items-center justify-center rounded-full hover:bg-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4 bg-[#fdf6e3] max-h-[300px] overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="text-center py-4 text-sm font-bold text-[#a68a7e]">
            가방을 뒤적이는 중...
          </div>
        ) : (
          Object.entries(ITEMS).map(([id, info]) => {
            const qty = inventory[id] || 0;
            return (
              <DraggableItem
                key={id}
                itemId={id}
                name={info.name}
                emoji={info.emoji}
                quantity={qty}
              />
            );
          })
        )}
      </div>
      
      {!isLoading && (
        <div className="p-3 bg-white text-xs text-center font-bold text-[#a68a7e] border-t-2 border-[#e8dac1]">
          💡 간식을 마우스로 끌어 캐릭터에게 먹여보세요!
        </div>
      )}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return null;
}
