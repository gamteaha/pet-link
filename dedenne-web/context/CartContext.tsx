"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { createClient } from "../utils/supabase/client";
import { useAuth } from "./AuthContext";
import { useRouter } from "next/navigation";

export const ITEM_CATALOG: Record<string, { id: string; name: string; price: number; emoji: string; description: string }> = {
  dedenne:    { id: "dedenne",    name: "데덴네 (사전체험판)", price: 5, emoji: "🐭", description: "전기를 다루는 귀여운 쥐 포켓몬!" },
  raccoon:    { id: "raccoon",    name: "너구리",     price: 50, emoji: "🦝", description: "장난꾸러기 너구리" },
  pig:        { id: "pig",        name: "돼지",       price: 30, emoji: "🐷", description: "통통한 아기 돼지" },
  chick:      { id: "chick",      name: "병아리",     price: 20, emoji: "🐥", description: "삐약삐약 병아리" },
  chicken:    { id: "chicken",    name: "닭",         price: 40, emoji: "🐔", description: "알을 낳는 닭" },
  horse:      { id: "horse",      name: "말",         price: 80, emoji: "🐴", description: "초원을 달리는 멋진 말" },
  'blue-tang': { id: "blue-tang",  name: "파란돔",     price: 120, emoji: "🐟", description: "아름다운 파란색 물고기" },
  bread:      { id: "bread",      name: "맛있는 식빵 (10개)", price: 5, emoji: "🍞", description: "바삭하고 고소한 갓 구운 식빵 10개 묶음" },
  strawberry: { id: "strawberry", name: "상큼한 딸기 (10개)", price: 8, emoji: "🍓", description: "비타민이 가득한 달콤한 딸기 10개 묶음" },
  soap:       { id: "soap",       name: "몽글몽글 비누 (10개)", price: 12, emoji: "🧼", description: "거품이 풍성하게 나는 목욕용 비누 10개 묶음" },
  towel:      { id: "towel",      name: "부드러운 수건 (10개)", price: 10, emoji: "🧻", description: "물기를 뽀송하게 닦아주는 수건 10개 묶음" },
};

// ─── 타입 정의 ───────────────────────────────────────────────────────────────
export interface CartItem {
  id: string;        // cart_items.id (uuid)
  itemId: string;    // cart_items.item_id ('dedenne' 등)
  name: string;
  price: number;
  emoji: string;
  description: string;
  addedAt: string;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  totalPrice: number;
  addToCart: (itemId: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  isInCart: (itemId: string) => boolean;
  isLoading: boolean;
  toast: { message: string; type: "success" | "error" | "warning" } | null;
}

// ─── Context 생성 ─────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextType>({
  cartItems: [],
  cartCount: 0,
  totalPrice: 0,
  addToCart: async () => {},
  removeFromCart: async () => {},
  isInCart: () => false,
  isLoading: false,
  toast: null,
});

// ─── Provider ────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  // 토스트 표시 헬퍼
  const showToast = (message: string, type: "success" | "error" | "warning") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Supabase에서 장바구니 목록 불러오기
  const fetchCartItems = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("added_at", { ascending: true });

    if (!error && data) {
      const mapped: CartItem[] = data
        .filter((row) => ITEM_CATALOG[row.item_id]) // 카탈로그에 있는 것만
        .map((row) => ({
          ...ITEM_CATALOG[row.item_id],
          id: row.id,
          itemId: row.item_id,
          addedAt: row.added_at,
        }));
      setCartItems(mapped);
    }
    setIsLoading(false);
  }, [user, supabase]);

  // 유저 변경 시 장바구니 재로드
  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  // ─── addToCart ──────────────────────────────────────────────────────────────
  const addToCart = async (itemId: string) => {
    if (!user) {
      // 비로그인 → 로그인 알림 토스트 표시
      showToast('로그인 후 이용 가능합니다', 'warning');
      return;
    }

    if (isInCart(itemId)) {
      showToast("이미 장바구니에 담긴 캐릭터입니다 🛒", "warning");
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: user.id, item_id: itemId });

    if (error) {
      if (error.code === "23505") {
        showToast("이미 장바구니에 담긴 캐릭터입니다 🛒", "warning");
      } else {
        console.error(error);
        showToast("장바구니 담기에 실패했습니다 😢", "error");
      }
    } else {
      showToast(`${ITEM_CATALOG[itemId]?.name ?? itemId}을(를) 장바구니에 담았습니다! 🎉`, "success");
      await fetchCartItems();
    }
  };

  // ─── removeFromCart ─────────────────────────────────────────────────────────
  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", itemId);

    if (error) {
      showToast("삭제에 실패했습니다 😢", "error");
    } else {
      showToast("장바구니에서 제거했습니다.", "success");
      await fetchCartItems();
    }
  };

  // ─── isInCart ───────────────────────────────────────────────────────────────
  const isInCart = (itemId: string) => cartItems.some((item) => item.itemId === itemId);

  const cartCount = cartItems.length;
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ cartItems, cartCount, totalPrice, addToCart, removeFromCart, isInCart, isLoading, toast }}>
      {children}

      {/* ── 토스트 알림 UI ── */}
      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-full font-bold shadow-2xl text-white text-base flex items-center gap-4 transition-all animate-fade-in ${
            toast.type === "success"
              ? "bg-[#8c4a23]"
              : toast.type === "warning"
              ? "bg-[#e07a5f]"
              : "bg-red-500"
          }`}
        >
          <span>{toast.message}</span>
          {toast.type === "success" && (
            <button
              onClick={() => router.push("/cart")}
              className="ml-2 px-4 py-1.5 bg-white text-[#8c4a23] rounded-full text-sm font-black shadow-sm hover:scale-105 transition-transform"
            >
              장바구니 가기 🛒
            </button>
          )}
        </div>
      )}
    </CartContext.Provider>
  );
}

// ─── useCart Hook ─────────────────────────────────────────────────────────────
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (ctx === undefined) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
