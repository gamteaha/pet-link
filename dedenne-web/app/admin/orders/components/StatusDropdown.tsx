"use client";

import React, { useState } from "react";
import { createClient } from "../../../../utils/supabase/client";

type StatusDropdownProps = {
  orderId: string;
  userId: string;
  currentStatus: string;
  onStatusChange: () => void;
};

export default function StatusDropdown({ orderId, userId, currentStatus, onStatusChange }: StatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === status) return;

    if (!confirm(`주문 상태를 '${newStatus}'(으)로 변경하시겠습니까? \n(취소 시 인벤토리 수량이 복구됩니다.)`)) {
      e.target.value = status;
      return;
    }

    setIsUpdating(true);
    try {
      // 1. 상태 업데이트
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // 2. 인벤토리 롤백/복구 로직
      // 주문에 포함된 아이템 내역 가져오기
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("item_id")
        .eq("order_id", orderId);

      if (orderItems && orderItems.length > 0) {
        // cancelled일 경우 유저 인벤토리에서 차감, completed일 경우 다시 추가 (상점에 맞게 조정 가능)
        // 여기서는 단일 수량 10개로 묶여 판매되는 구조에 맞게 구현
        const quantityChange = newStatus === "cancelled" ? -10 : 10;

        for (const oi of orderItems) {
          const { data: currentInv } = await supabase
            .from("user_inventory")
            .select("quantity")
            .eq("user_id", userId)
            .eq("item_id", oi.item_id)
            .single();
            
          const currentQty = currentInv?.quantity || 0;
          const newQty = Math.max(0, currentQty + quantityChange); // 음수 방지

          await supabase.from("user_inventory").upsert({
            user_id: userId,
            item_id: oi.item_id,
            quantity: newQty,
            updated_at: new Date().toISOString()
          }, { onConflict: "user_id, item_id" });
        }
      }

      setStatus(newStatus);
      onStatusChange();
      alert("주문 상태가 성공적으로 변경되었습니다.");
    } catch (err) {
      console.error(err);
      alert("상태 변경 중 오류가 발생했습니다.");
      e.target.value = status;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <select
      value={status}
      onChange={handleStatusChange}
      disabled={isUpdating}
      className={`px-3 py-1.5 rounded-lg font-bold text-sm border-2 outline-none transition-colors cursor-pointer ${
        status === "completed" 
          ? "bg-green-50 text-green-700 border-green-200 focus:border-green-400" 
          : "bg-red-50 text-red-700 border-red-200 focus:border-red-400"
      } disabled:opacity-50`}
    >
      <option value="completed">결제완료</option>
      <option value="cancelled">주문취소</option>
    </select>
  );
}
