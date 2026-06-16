"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  referenceCount?: number;
};

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  referenceCount = 0,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm border-4 border-red-500 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">정말 삭제하시겠습니까?</h2>
              <p className="text-gray-600 font-bold">
                <span className="text-[#e07a5f]">[{itemName}]</span> 아이템을 삭제합니다.
              </p>
            </div>

            {referenceCount > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 text-sm text-red-700 font-bold">
                주의: 이 아이템은 현재 <span className="text-xl mx-1">{referenceCount}</span>번 구매되었거나 유저 인벤토리에 존재합니다. 삭제 시 관련 주문 내역에 문제가 발생할 수 있습니다.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                삭제하기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
