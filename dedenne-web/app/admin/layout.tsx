"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") {
      router.replace("/");
    } else {
      setIsAuthed(true);
    }
  }, [router]);

  if (!isAuthed) return null;

  const menuItems = [
    { href: "/admin", label: "대시보드", icon: "📊" },
    { href: "/admin/users", label: "유저 및 캐릭터 데이터 관리", icon: "👥" },
    { href: "/admin/items", label: "상점 아이템 관리", icon: "🛍️" },
    { href: "/admin/cheese", label: "치즈 관리", icon: "🧀" },
    { href: "/admin/orders", label: "결제 및 매출 내역 조회", icon: "💳" },
    { href: "/admin/stats", label: "정산 및 매출 현황", icon: "📈" },
    { href: "/admin/logs", label: "시스템 로그 및 데이터베이스", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-[#fdf6e3] text-[#4a2e1b] font-sans flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-[#1a1a2e] text-white border-b border-white/10 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <h1 className="text-xl font-black tracking-tight">데덴네 웹 관리자</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors"
          >
            메인 서비스 바로가기
          </Link>
          <button
            onClick={() => {
              sessionStorage.removeItem("adminAuth");
              router.replace("/");
            }}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-bold transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 사이드바 메뉴 */}
        <aside className="w-72 bg-[#16213e] text-white flex-shrink-0 border-r border-white/10 overflow-y-auto">
          <nav className="p-4 flex flex-col gap-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                    isActive
                      ? "bg-[#e07a5f] text-white shadow-lg"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 오른쪽 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
