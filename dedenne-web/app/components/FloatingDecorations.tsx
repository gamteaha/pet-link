"use client";

import React from "react";
import { motion } from "framer-motion";

export default function FloatingDecorations() {
  return (
    <>
      {/* ------------------- NEW LARGE SIDE DECORATIONS ------------------- */}
      
      {/* 왼쪽 하단 — 고양이 낚싯대 */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '0px',
          fontSize: '120px',
          opacity: 0.65,
          pointerEvents: 'auto',
          zIndex: 0,
          cursor: 'pointer',
          transformOrigin: 'top center',
        }}
        whileHover={{
          rotate: [0, -15, 15, -15, 0],
          transition: { duration: 0.6, ease: 'easeInOut' }
        }}
      >
        🎣
      </motion.div>

      {/* 오른쪽 하단 — 고양이 장난감 (방울 달린 막대) */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '100px',
          right: '0px',
          fontSize: '120px',
          opacity: 0.65,
          pointerEvents: 'auto',
          zIndex: 0,
          cursor: 'pointer',
          transformOrigin: 'top center',
        }}
        whileHover={{
          rotate: [0, 15, -15, 15, 0],
          transition: { duration: 0.6, ease: 'easeInOut' }
        }}
      >
        🪄
      </motion.div>

      {/* 왼쪽 중하단 — 큰 뼈다귀 */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '320px',
          left: '10px',
          fontSize: '100px',
          opacity: 0.55,
          pointerEvents: 'auto',
          zIndex: 0,
          cursor: 'pointer',
        }}
        whileHover={{
          y: [0, -20, 0],
          scale: [1, 1.15, 1],
          transition: { duration: 0.5, ease: 'easeInOut' }
        }}
      >
        🦴
      </motion.div>

      {/* 오른쪽 중하단 — 큰 발자국 */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '300px',
          right: '10px',
          fontSize: '100px',
          opacity: 0.55,
          pointerEvents: 'auto',
          zIndex: 0,
          cursor: 'pointer',
        }}
        whileHover={{
          scale: [1, 1.2, 1],
          rotate: [0, -10, 10, 0],
          transition: { duration: 0.5, ease: 'easeInOut' }
        }}
      >
        🐾
      </motion.div>

      {/* ------------------- EXISTING SMALL DECORATIONS ------------------- */}

      {/* 기존 고양이 장난감 (낚싯대) - 변경 */}
      <motion.div
        style={{
          position: "absolute",
          top: "15%",
          right: "20%",
          fontSize: "42px",
          opacity: 0.6,
          pointerEvents: "auto",
          zIndex: 0,
          userSelect: "none",
          transformOrigin: "top right",
        }}
        animate={{ rotate: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ rotate: 25, scale: 1.2 }}
      >
        🧶
      </motion.div>

      {/* 뼈다귀 */}
      <motion.div
        style={{
          position: "absolute",
          top: "18%",
          left: "15%",
          fontSize: "36px",
          opacity: 0.45,
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        🦴
      </motion.div>

      {/* 발자국 */}
      <motion.div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "25%",
          fontSize: "32px",
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        🐾
      </motion.div>

      {/* 물고기 */}
      <motion.div
        style={{
          position: "absolute",
          top: "40%",
          left: "15%",
          fontSize: "36px",
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
        animate={{ x: [0, 20, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      >
        🐟
      </motion.div>

      {/* 하트 */}
      <motion.div
        style={{
          position: "absolute",
          top: "20%",
          left: "60%",
          fontSize: "28px",
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
        animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        🩷
      </motion.div>

      {/* 별 1 */}
      <motion.div
        style={{
          position: "absolute",
          top: "25%",
          right: "30%",
          fontSize: "24px",
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
        animate={{ opacity: [0.1, 0.8, 0.1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      >
        ✨
      </motion.div>

      {/* 별 2 */}
      <motion.div
        style={{
          position: "absolute",
          bottom: "35%",
          left: "20%",
          fontSize: "20px",
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
        animate={{ opacity: [0.1, 0.8, 0.1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
      >
        ✨
      </motion.div>

      {/* 별 3 */}
      <motion.div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "40%",
          fontSize: "28px",
          pointerEvents: "none",
          zIndex: 0,
          userSelect: "none",
        }}
        animate={{ opacity: [0.1, 0.8, 0.1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
      >
        ✨
      </motion.div>
    </>
  );
}
