"use client";

import React, { useState } from "react";
import StatusDropdown from "./StatusDropdown";
import { motion, AnimatePresence } from "framer-motion";
import { getOrderItems } from "../../actions";

type OrderRowProps = {
  order: any;
  onStatusChange: () => void;
};

export default function OrderRow({ order, onStatusChange }: OrderRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const handleToggle = async () => {
    if (!isExpanded && orderItems.length === 0) {
      setIsLoadingItems(true);
      try {
        const data = await getOrderItems(order.id);
        setOrderItems(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingItems(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const shortId = order.id.split("-")[0];
  const orderDate = new Date(order.ordered_at).toLocaleString();

  return (
    <>
      <tr 
        onClick={handleToggle}
        className="border-b border-[#e8dac1]/50 hover:bg-[#f8eedb]/30 transition-colors cursor-pointer"
      >
        <td className="p-4 font-bold text-sm text-gray-500 uppercase">{shortId}</td>
        <td className="p-4 font-bold text-[#4a2e1b]">
          {order.profiles?.display_name || order.profiles?.email || "알 수 없음"}
        </td>
        <td className="p-4 text-sm text-[#a68a7e]">{orderDate}</td>
        <td className="p-4 font-bold text-gray-600 text-center">
          {order.isRealMoney ? (
            <span className="text-[#8c4a23]">+ {order.cheese_amount}개 (충전)</span>
          ) : (
            <span className="text-[#a68a7e]">- {order.cheese_amount}개 (사용)</span>
          )}
        </td>
        <td className="p-4 font-black text-[#e07a5f]">
          {order.isRealMoney ? `₩ ${order.krw_amount.toLocaleString()}` : "-"}
        </td>
        <td className="p-4" onClick={(e) => e.stopPropagation()}>
          <StatusDropdown 
            orderId={order.id} 
            userId={order.user_id} 
            currentStatus={order.status} 
            onStatusChange={onStatusChange} 
          />
        </td>
      </tr>

      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={6} className="p-0 border-b border-[#e8dac1]">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#fdf6e3]"
              >
                <div className="p-6">
                  <h4 className="text-sm font-black text-[#a68a7e] mb-3">주문 상세 품목</h4>
                  {isLoadingItems ? (
                    <div className="text-sm font-bold text-gray-500">불러오는 중...</div>
                  ) : orderItems.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-[#e8dac1] flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#f8eedb] rounded-lg flex items-center justify-center text-2xl">
                          🧀
                        </div>
                        <div>
                          <p className="font-bold text-[#4a2e1b]">치즈 충전</p>
                          <div className="flex gap-2 text-xs text-[#a68a7e] font-bold mt-1">
                            <span className="uppercase">CHARGE</span>
                            <span>•</span>
                            <span>₩ {order.krw_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {orderItems.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-[#e8dac1] flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#f8eedb] rounded-lg flex items-center justify-center text-2xl">
                            {item.items?.emoji || "📦"}
                          </div>
                          <div>
                            <p className="font-bold text-[#4a2e1b]">{item.item_name}</p>
                            <div className="flex gap-2 text-xs text-[#a68a7e] font-bold mt-1">
                              {item.items?.category && <span className="uppercase">{item.items.category}</span>}
                              <span>•</span>
                              <span>🧀 {item.price}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
