"use client";

import React from "react";

export type DraggableItemProps = {
  itemId: string;
  name: string;
  emoji: string;
  quantity: number;
};

export default function DraggableItem({ itemId, name, emoji, quantity }: DraggableItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("itemId", itemId);
    // Optional: make it look slightly transparent while dragging
  };

  return (
    <div
      draggable={quantity > 0}
      onDragStart={handleDragStart}
      className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
        quantity > 0 
          ? "border-[#e8dac1] bg-white cursor-grab hover:border-[#e07a5f] hover:shadow-sm" 
          : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <span className="font-bold text-sm text-[#4a2e1b]">{name}</span>
      </div>
      <span className="font-black text-[#a68a7e] bg-[#f8eedb] px-2 py-1 rounded-lg text-xs">
        x{quantity}
      </span>
    </div>
  );
}
