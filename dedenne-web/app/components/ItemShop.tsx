"use client";

import React, { useEffect, useState } from "react";
import { useCart, ITEM_CATALOG } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useCheese } from "../../context/CheeseContext";
import { createClient } from "../../utils/supabase/client";

export default function ItemShop() {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { spendCheese } = useCheese();
  const supabase = createClient();
  const [inventory, setInventory] = useState<{ item_id: string; quantity: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 인벤토리 데이터 불러오기 및 실시간 구독
  useEffect(() => {
    if (!user) {
      setInventory([]);
      setIsLoading(false);
      return;
    }

    const fetchInventory = async () => {
      setIsLoading(true);
      const { data: invData, error: invError } = await supabase
        .from("user_inventory")
        .select("item_id, quantity")
        .eq("user_id", user.id);
      
      if (!invError && invData) {
        setInventory(invData);
      }
      setIsLoading(false);
    };

    fetchInventory();

    const invChannel = supabase
      .channel("user_inventory_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_inventory", filter: `user_id=eq.${user.id}` },
        () => fetchInventory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invChannel);
    };
  }, [user, supabase]);

  const handleBuyNow = async (item: any) => {
    if (!user) {
      alert("로그인 후 결제해주세요.");
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('cheese_balance').eq('id', user.id).single();
    const currentCheese = profile?.cheese_balance || 0;

    if (currentCheese < item.price) {
      alert("치즈가 부족합니다.");
      return;
    }

    setIsLoading(true);
    try {
      await spendCheese(item.price);

      const { data: order } = await supabase.from('orders').insert({
        user_id: user.id,
        total_items: 1,
        total_price: item.price,
        status: 'completed'
      }).select().single();

      const { data: profileData } = await supabase.from('profiles').select('cheese_balance').eq('id', user.id).single();
      const currentBalanceAfterSpend = profileData?.cheese_balance || 0;

      await supabase.from('cheese_logs').insert({
        user_id: user.id,
        change_type: 'spend',
        amount: -item.price,
        balance_after: currentBalanceAfterSpend,
        reason: `상점 아이템 구매 (${item.name})`
      });

      if (order) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          item_id: item.id,
          item_name: item.name,
          price: item.price
        });
      }

      const { data: currentInv } = await supabase.from('user_inventory').select('quantity').eq('user_id', user.id).eq('item_id', item.id).single();
      const currentQty = currentInv?.quantity || 0;

      await supabase.from('user_inventory').upsert({
        user_id: user.id,
        item_id: item.id,
        quantity: currentQty + 10,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, item_id' });

      // [로컬 파이썬 앱 연동] Next.js 서버에서 직접 파이썬 앱 파일에 수량을 더함
      fetch('/api/inventory/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: item.id, quantity: 10 }] })
      }).catch(err => console.error("Local sync error:", err));

      alert(`${item.name}을(를) 구매했습니다! 🎉`);
    } catch (e) {
      console.error(e);
      alert("구매에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 상점에 표시할 아이템 목록 필터링 (캐릭터 제외)
  const shopItems = [
    ITEM_CATALOG.bread,
    ITEM_CATALOG.strawberry,
    ITEM_CATALOG.soap,
    ITEM_CATALOG.towel,
  ];

  return (
    <div className="mt-16 w-full z-10 relative">
      <div className="flex items-center justify-between mb-8 border-b-2 border-[#e8dac1] pb-4">
        <h2 className="text-3xl font-bold">아이템 상점 (Item Shop)</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 아이템 그리드 */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {shopItems.map((item) => (
              <div 
                key={item.id} 
                className="pet-case-card group flex flex-col cursor-pointer"
              >
                <div className="p-6 flex-1 flex flex-col z-10">
                  <div className="pet-display-area mb-4">
                    <span className="text-7xl group-hover:animate-bounce">{item.emoji}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-2">{item.name}</h3>
                  <p className="text-[var(--color-pet-subtext)] text-sm mb-6 flex-1">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap justify-between items-center mt-auto gap-3">
                    <span className="text-xl font-bold text-[var(--color-pet-point)] whitespace-nowrap">🧀 {item.price} 개</span>
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          addToCart(item.id);
                        }}
                        className="flex-1 lg:flex-none px-3 py-2 bg-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.8)] text-[var(--color-pet-text)] rounded-full font-bold text-sm transition-colors shadow-sm whitespace-nowrap border border-[rgba(255,255,255,0.6)]"
                      >
                        🛒 담기
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleBuyNow(item);
                        }}
                        className="flex-1 lg:flex-none px-3 py-2 bg-[var(--color-pet-point)] hover:bg-[#d59868] text-white rounded-full font-bold text-sm transition-colors shadow-sm whitespace-nowrap"
                      >
                        ⚡ 결제
                      </button>
                    </div>
                  </div>
                </div>
                <div className="pet-case-floor"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 미니멀 인벤토리 (임시 뷰) */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="bg-[#f8eedb] rounded-[2rem] p-6 border-4 border-[#4a2e1b] shadow-lg sticky top-8">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <span>🎒</span> 내 가방 (Inventory)
            </h3>
            
            <div className="bg-white rounded-xl p-4 min-h-[150px] border-2 border-[#e8dac1] mb-4 flex flex-col justify-center">
              {!user ? (
                <p className="text-[#a68a7e] font-bold text-sm text-center">
                  로그인하면 가방을<br/>확인할 수 있습니다.
                </p>
              ) : isLoading ? (
                <div className="flex justify-center my-4">
                  <span className="animate-bounce inline-block text-4xl">🐾</span>
                </div>
              ) : inventory.length === 0 ? (
                <p className="text-[#a68a7e] font-bold text-sm text-center">
                  아직 구매한 아이템이<br/>없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {inventory.map((inv) => {
                    const catalogItem = ITEM_CATALOG[inv.item_id];
                    if (!catalogItem || inv.quantity <= 0) return null;
                    return (
                      <div key={inv.item_id} className="relative group cursor-help bg-[#f8eedb] rounded-lg aspect-square flex items-center justify-center border border-[#e8dac1]">
                        <span className="text-2xl">{catalogItem.emoji}</span>
                        {/* 수량 뱃지 */}
                        <div className="absolute -bottom-2 -right-2 bg-[#4a2e1b] text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                          {inv.quantity}
                        </div>
                        {/* 툴팁 */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#4a2e1b] text-white text-xs font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {catalogItem.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 안내 툴팁 박스 (기하학적) */}
            <div className="relative bg-[#e07a5f] text-white p-4 rounded-xl shadow-md text-sm font-bold mb-8">
              <div className="absolute -top-2 left-6 w-4 h-4 bg-[#e07a5f] rotate-45"></div>
              💡 이 아이템들은 다운로드하신 데스크톱 앱 가방 안에서도 실시간으로 연동됩니다!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
