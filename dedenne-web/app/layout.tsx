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
            </CartProvider>
          </CheeseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
