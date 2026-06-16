"use client";

import { useEffect, useState } from "react";

export default function BellSound() {
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (hasPlayed) return;

    const playBell = async () => {
      try {
        const bell = new Audio("/daviddumaisaudio-store-entrance-bell-188054.mp3");
        bell.volume = 0.4;
        await bell.play();
        setHasPlayed(true);
      } catch (err) {
        // Autoplay policy might block this initially, ignore silently
        console.warn("Entrance bell autoplay blocked", err);
      }
    };

    // Attempt to play on mount
    playBell();

    // Also attempt to play on first user interaction if blocked
    const handleInteraction = () => {
      if (!hasPlayed) {
        playBell();
      }
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [hasPlayed]);

  return null;
}
