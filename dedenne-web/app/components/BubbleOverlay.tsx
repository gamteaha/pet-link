"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

type Bubble = {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
};

export default function BubbleOverlay() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    // Generate 30 bubbles randomly
    const newBubbles: Bubble[] = [];
    for (let i = 0; i < 30; i++) {
      newBubbles.push({
        id: i,
        x: Math.random() * 100, // percentage of screen width
        size: Math.random() * 20 + 10, // 10 to 30px
        duration: Math.random() * 2 + 3, // 3 to 5 seconds
        delay: Math.random() * 2, // 0 to 2 seconds delay
      });
    }
    setBubbles(newBubbles);
  }, []);

  const content = (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          initial={{ 
            y: "110vh", 
            x: `${b.x}vw`,
            opacity: 0.8
          }}
          animate={{ 
            y: "-10vh", 
            x: [`${b.x}vw`, `${b.x - 2}vw`, `${b.x + 2}vw`, `${b.x}vw`],
            opacity: 0 
          }}
          transition={{
            y: { duration: b.duration, delay: b.delay, ease: "easeOut", repeat: Infinity },
            x: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: b.duration, delay: b.delay, ease: "easeIn", repeat: Infinity }
          }}
          className="absolute rounded-full border-2 border-blue-200/50"
          style={{
            width: b.size,
            height: b.size,
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(200,230,255,0.2))"
          }}
        >
          {/* 하이라이트 */}
          <div className="absolute top-[15%] left-[20%] w-[30%] h-[30%] bg-white/60 rounded-full" />
        </motion.div>
      ))}
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return null;
}
