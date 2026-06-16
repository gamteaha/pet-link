"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import InventoryPopup from "./InventoryPopup";
import { createClient } from "../../utils/supabase/client";
import { useAuth } from "../../context/AuthContext";

type CharacterWithEyesProps = {
  children: React.ReactNode;
  className?: string;
  onFeed?: (itemId: string) => void;
  disableEyeTracking?: boolean;
};

export default function CharacterWithEyes({ children, className = "", onFeed, disableEyeTracking = false }: CharacterWithEyesProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Eye tracking state
  const [headAngle, setHeadAngle] = useState(0);
  
  // Inventory popup state
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryPos, setInventoryPos] = useState({ x: 0, y: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Feeding animation
  const controls = useAnimation();
  const [isEating, setIsEating] = useState(false);
  const [eatingEmoji, setEatingEmoji] = useState<string | null>(null);

  // Eye tracking logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || inventoryOpen) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      
      const dx = e.clientX - centerX;
      const maxAngle = 15;
      
      let angle = (dx / 300) * maxAngle;
      if (angle > maxAngle) angle = maxAngle;
      if (angle < -maxAngle) angle = -maxAngle;
      
      setHeadAngle(angle);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [inventoryOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInventoryOpen(true);
    setInventoryPos({ x: e.clientX, y: e.clientY });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("itemId");
    if (!itemId) return;

    // Trigger eat animation
    const emojiMap: Record<string, string> = {
      bread: "🍞", strawberry: "🍓", soap: "🧼", towel: "🧻"
    };
    const emoji = emojiMap[itemId] || "✨";
    
    setEatingEmoji(emoji);
    setIsEating(true);
    
    // Play sound if possible (fire and forget)
    try {
      const audio = new Audio("/sounds/eat.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {}); // ignore errors if file doesn't exist
    } catch(e) {}
    
    // Animate character
    await controls.start({
      scale: [1, 1.2, 0.9, 1.15, 1],
      rotate: [0, -5, 5, -3, 0],
      transition: { duration: 0.5 }
    });
    
    setTimeout(() => {
      setIsEating(false);
      setEatingEmoji(null);
    }, 500);

    // Update Supabase
    if (user) {
      const { data } = await supabase
        .from('user_inventory')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .single();
        
      if (data && data.quantity > 0) {
        await supabase
          .from('user_inventory')
          .update({ quantity: data.quantity - 1 })
          .eq('user_id', user.id)
          .eq('item_id', itemId);
          
        setRefreshTrigger(prev => prev + 1);
        if (onFeed) onFeed(itemId);
      }
    }
  };

  return (
    <>
      <div 
        className={`relative ${className}`}
        ref={containerRef}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <motion.div
          animate={controls}
          style={{ 
            rotate: disableEyeTracking || isEating ? undefined : headAngle,
            transition: isEating ? "none" : "transform 0.15s ease-out" 
          }}
          className="w-full h-full flex items-center justify-center cursor-pointer"
        >
          {children}
        </motion.div>
        
        {/* Eating Emoji Particle */}
        {isEating && eatingEmoji && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: 20, scale: [0.5, 1.2, 0.8] }}
            transition={{ duration: 0.8, ease: "easeIn" }}
            className="absolute top-[-30px] left-1/2 -translate-x-1/2 text-4xl pointer-events-none z-50 drop-shadow-md"
          >
            {eatingEmoji}
          </motion.div>
        )}
      </div>

      {inventoryOpen && (
        <InventoryPopup
          position={inventoryPos}
          onClose={() => setInventoryOpen(false)}
          refreshTrigger={refreshTrigger}
        />
      )}
    </>
  );
}
