"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "../../../../utils/supabase/client";
import { exportCsv } from "../../orders/utils/exportCsv";

type ExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const supabase = createClient();

  const handleExport = async () => {
    if (!startDate || !endDate) {
      alert("시작일과 종료일을 모두 선택해주세요.");
      return;
    }
    
    setIsExporting(true);
    
    try {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Fetch completed orders within date range, including order_items
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          total_price,
          profiles (
            display_name,
            email
          ),
          order_items (
            item_name,
            price
          )
        `)
        .eq("status", "completed")
        .gte("created_at", new Date(startDate).toISOString())
        .lte("created_at", end.toISOString());

      if (error) throw error;
      if (!orders || orders.length === 0) {
        alert("해당 기간에 정산할 내역이 없습니다.");
        setIsExporting(false);
        return;
      }

      // Flatten the data so each row is one item sold.
      // If we want a summary per order, we would do it differently.
      // But usually settlement requires detailed item logs.
      const exportData: any[] = [];
      orders.forEach((order: any) => {
        const userName = order.profiles?.display_name || order.profiles?.email || "알 수 없음";
        const orderDate = new Date(order.created_at).toLocaleString();
        
        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach((item: any) => {
            exportData.push({
              "주문번호": order.id,
              "결제일시": orderDate,
              "유저명": userName,
              "아이템명": item.item_name,
              "결제금액": item.price,
            });
          });
        } else {
          // fallback if no items found
          exportData.push({
            "주문번호": order.id,
            "결제일시": orderDate,
            "유저명": userName,
            "아이템명": "-",
            "결제금액": order.total_price,
          });
        }
      });

      exportCsv(exportData, `settlement_${startDate}_to_${endDate}.csv`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("정산 데이터를 가져오는데 실패했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm border-4 border-[#e8dac1] shadow-2xl"
          >
            <h2 className="text-2xl font-black text-[#4a2e1b] mb-2">정산 데이터 다운로드</h2>
            <p className="text-[#a68a7e] font-bold text-sm mb-6">
              선택한 기간 내 결제가 완료된 내역(order_items)을 엑셀로 추출합니다.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-[#4a2e1b] mb-1">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#4a2e1b] mb-1">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-[#e8dac1] bg-[#f8eedb]/50 text-[#4a2e1b] focus:outline-none focus:border-[#e07a5f] font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 py-3 bg-[#e07a5f] hover:bg-[#c44933] text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {isExporting ? "다운로드 중..." : "다운로드"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
