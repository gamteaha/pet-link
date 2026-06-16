"use client";

import { useEffect } from "react";
import CustomPet from "../components/CustomPet";

export default function DesktopPetPage() {
  useEffect(() => {
    // Force transparency on HTML and Body elements for the desktop pet
    document.documentElement.classList.add("desktop-mode");
    return () => {
      document.documentElement.classList.remove("desktop-mode");
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden">
      <CustomPet />
    </div>
  );
}
