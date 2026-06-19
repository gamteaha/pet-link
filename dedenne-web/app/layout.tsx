import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pet-Link | Dedenne Desktop Companion",
  description: "Experience the next level of desktop companionship with Dedenne.",
};

import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { CheeseProvider } from "../context/CheeseContext";
import WebTutorial from "./components/WebTutorial";
import AdminGate from "./components/AdminGate";
import SplashScreen from "./components/SplashScreen";
import FloatingDecorations from "./components/FloatingDecorations";

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pet-bg-pattern text-[var(--color-pet-text)] relative overflow-x-hidden">
        <div className="shop-fluorescent-overlay"></div>
        <FloatingDecorations />
        <SplashScreen />
        <AuthProvider>
          <CheeseProvider>
            <CartProvider>
              {children}
              {modal}
              <WebTutorial />
              <AdminGate />
              <footer className="w-full bg-[rgba(255,255,255,0.4)] border-t border-[rgba(255,255,255,0.6)] py-6 mt-auto text-center text-sm font-bold text-[var(--color-pet-subtext)] z-10 relative backdrop-blur-sm">
                <p>Developer: 202601664 김태희</p>
                <p>Email: <a href="mailto:gamteaha@gmail.com" className="hover:text-[var(--color-pet-point)] underline">gamteaha@gmail.com</a></p>
                <p className="mt-2 opacity-70">© 2026 Pet-Link. All rights reserved.</p>
              </footer>
            </CartProvider>
          </CheeseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
