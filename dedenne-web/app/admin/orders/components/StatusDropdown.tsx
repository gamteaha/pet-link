"use client";

import React, { useState } from "react";
import { updateOrderStatus } from "../../actions";

type StatusDropdownProps = {
  orderId: string;
  userId: string;
  currentStatus: string;
  onStatusChange: () => void;
};

export default function StatusDropdown({ orderId, userId, currentStatus, onStatusChange }: StatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === status) return;

    if (!confirm(`주문 상태를 '${newStatus}'(으)로 변경하시겠습니까? \n(취소 시 인벤토리 수량이 복구됩니다.)`)) {
      e.target.value = status;
      return;
    }

    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, userId, newStatus);

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
