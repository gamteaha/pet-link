"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Character3D from "../components/Character3D";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useCheese } from "../../context/CheeseContext";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import Universal3DViewer from "../components/characters/Universal3DViewer";

import JSZip from "jszip";

// Helper for skin color (same as customize/page.tsx)
function getSkinColorHex(value: number) {
  const r = Math.round(255 - (255 - 74) * (value / 100));
  const g = Math.round(224 - (224 - 46) * (value / 100));
  const b = Math.round(196 - (196 - 27) * (value / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { cheeseBalance, spendCheese } = useCheese();
  const { cartItems: contextCartItems, removeFromCart: removeContextItem } = useCart();
  const [localCartItems, setLocalCartItems] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState<Record<number, boolean>>({});
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutToast, setCheckoutToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "warning") => {
    setCheckoutToast({ message, type });
    setTimeout(() => setCheckoutToast(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('petLink_cart');
    if (saved) {
      setLocalCartItems(JSON.parse(saved));
    }
  }, []);

  const handleDownloadPetData = async (pet: any) => {
    setIsDownloading((prev) => ({ ...prev, [pet.id]: true }));
    try {
      // 1. Fetch the base player zip file
      const response = await fetch("/releases/custom-pet-player.zip");
      if (!response.ok) throw new Error("Failed to fetch custom player package.");
      const blob = await response.blob();

      // 2. Load the zip with JSZip
      const zip = await JSZip.loadAsync(blob);

      // 3. Inject the pet's configuration as 'character.petlink' inside the zip
      // Also make sure we save the name as well and inject serverUrl
      const petWithServer = {
        ...pet,
        serverUrl: typeof window !== "undefined" ? window.location.origin : "https://pet-link-1mnv.vercel.app"
      };
      const dataStr = JSON.stringify(petWithServer, null, 2);
      zip.file("pet-player/character.petlink", dataStr);

      // 4. Generate the new zip blob
      const content = await zip.generateAsync({ type: "blob" });

      // 5. Trigger download of the customized zip!
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pet.name || 'custom_pet'}_player.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating custom pet player zip:", error);
      // Fallback: just download the petlink JSON if zip generation fails
      const dataStr = JSON.stringify(pet, null, 2);
      const fallbackBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(fallbackBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pet.name || 'my_pet'}.petlink`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading((prev) => ({ ...prev, [pet.id]: false }));
    }
  };

  const handleRemove = async (id: any, isContextItem?: boolean) => {
    if (isContextItem) {
      await removeContextItem(id);
    } else {
      const updated = localCartItems.filter(item => item.id !== id);
      setLocalCartItems(updated);
      localStorage.setItem('petLink_cart', JSON.stringify(updated));
    }
  };

  const formattedContextItems = contextCartItems.map(item => ({
    id: item.itemId,
    shopId: item.itemId,
    name: item.name,
    price: item.price,
    emoji: item.emoji,
    isShopItem: true,
    isContextItem: true
  }));

  const combinedCartItems = [...formattedContextItems, ...localCartItems];
  
  const getQuantity = (id: string) => quantities[id] || 1;
  const setQuantity = (id: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const totalPrice = combinedCartItems.reduce((sum, item) => sum + (item.price ?? 10) * getQuantity(item.id), 0);
  const totalItemsCount = combinedCartItems.reduce((sum, item) => sum + getQuantity(item.id), 0);

  const handleCheckout = async () => {
    if (!user) {
      showToast("로그인 후 결제해주세요.", "warning");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    if (combinedCartItems.length === 0) return;

    if (cheeseBalance < totalPrice) {
      showToast("치즈가 부족합니다. 충전 페이지로 이동합니다.", "warning");
      setTimeout(() => router.push("/charge"), 1500);
      return;
    }

    setIsCheckoutLoading(true);

    try {
      const success = await spendCheese(totalPrice);
      if (!success) throw new Error("치즈 차감에 실패했습니다.");

      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_items: totalItemsCount,
          total_price: totalPrice,
          status: 'completed'
        })
        .select()
        .single();

      if (orderError) {
        console.error("Supabase Order Error:", orderError);
        throw new Error(`Order creation failed: ${orderError.message}`);
      }
      if (!order) throw new Error("Order creation failed: No data returned");

      // 2. Create order items (insert multiple if quantity > 1)
      const orderItemsToInsert: any[] = [];
      combinedCartItems.forEach(item => {
        const qty = getQuantity(item.id);
        for(let i=0; i<qty; i++) {
          orderItemsToInsert.push({
            order_id: order.id,
            item_id: item.shopId || item.id || 'custom',
            item_name: item.name || '알 수 없는 상품',
            price: item.price ?? 10
          });
        }
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) {
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error("Order items creation failed");
      }

      // 3. Update User Inventory
      const itemIdsToUpdate = combinedCartItems.map(item => item.shopId || item.id || 'custom');
      const { data: currentInv } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user.id)
        .in('item_id', itemIdsToUpdate);

      const invMap: Record<string, number> = {};
      if (currentInv) {
        currentInv.forEach(row => invMap[row.item_id] = row.quantity);
      }

      const inventoryUpserts = combinedCartItems.map(item => {
        const itemId = item.shopId || item.id || 'custom';
        const currentQty = invMap[itemId] || 0;
        const isConsumable = ['bread', 'soap', 'towel', 'strawberry'].includes(itemId);
        const addQty = getQuantity(item.id) * (isConsumable ? 10 : 1);
        return {
          user_id: user.id,
          item_id: itemId,
          quantity: currentQty + addQty,
          updated_at: new Date().toISOString()
        };
      });

      const { error: invError } = await supabase
        .from('user_inventory')
        .upsert(inventoryUpserts, { onConflict: 'user_id, item_id' });

      if (invError) {
        console.error("Inventory upsert failed:", invError);
      }

      // 4. Create User Pets for non-consumable characters
      const petInserts: any[] = [];
      const newLocalPets: any[] = [];
      
      combinedCartItems.forEach(item => {
        const itemId = item.shopId || item.id || 'custom';
        const isConsumable = ['bread', 'soap', 'towel', 'strawberry'].includes(itemId);
        
        if (!isConsumable) {
          const qty = getQuantity(item.id);
          for(let i=0; i<qty; i++) {
            // Give each pet a unique timestamp ID so they don't overwrite each other if quantity > 1
            const uniqueId = item.id + (i > 0 ? i : 0);
            const petConfig = { ...item, id: uniqueId };
            
            petInserts.push({
              user_id: user.id,
              pet_name: item.name || '나의 펫',
              config: petConfig
            });
            newLocalPets.push(petConfig);
          }
        }
      });

      if (petInserts.length > 0) {
        const { error: petInsertError } = await supabase
          .from('user_pets')
          .insert(petInserts);
          
        if (petInsertError) {
          console.error("Failed to insert pets:", petInsertError);
        }
        
        // Also save to localStorage for fallback
        const myPetsKey = user ? `petLink_myPets_${user.id}` : 'petLink_myPets';
        const savedPetsStr = localStorage.getItem(myPetsKey);
        let savedPets: any[] = savedPetsStr ? JSON.parse(savedPetsStr) : [];
        
        newLocalPets.forEach(pet => {
          if (!savedPets.find(p => p.id === pet.id)) {
            savedPets.push(pet);
          }
        });
        localStorage.setItem(myPetsKey, JSON.stringify(savedPets));
      }

      // 5. [로컬 파이썬 앱 연동] Next.js 서버에서 파이썬 앱의 json 파일에 직접 수량을 더해줍니다.
      const syncItems = combinedCartItems.map(item => {
        const itemId = item.shopId || item.id || 'custom';
        const isConsumable = ['bread', 'soap', 'towel', 'strawberry'].includes(itemId);
        return {
          id: itemId,
          quantity: getQuantity(item.id) * (isConsumable ? 10 : 1)
        };
      });
      
      fetch('/api/inventory/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: syncItems })
      }).catch(err => console.error("Local sync error:", err));

      // 4. Save custom pets to 'My Pets' gallery automatically
      const myPetsKey = `petLink_myPets_${user.id}`;
      const savedPetsStr = localStorage.getItem(myPetsKey);
      let savedPets: any[] = savedPetsStr ? JSON.parse(savedPetsStr) : [];
      let addedNew = false;
      
      const petsToInsertDB: any[] = [];

      combinedCartItems.forEach(item => {
        const isConsumable = ['bread', 'soap', 'towel', 'strawberry'].includes(item.id);
        if (!isConsumable) {
          // 중복 체크 없이 항상 DB upsert (id 기준 덮어쓰기)
          petsToInsertDB.push({
            id: item.id,
            user_id: user.id,
            pet_name: item.name || '나의 펫',
            config: item
          });
          if (!savedPets.find(p => p.id === item.id)) {
            savedPets.push(item);
            addedNew = true;
          }
        }
      });
      
      if (petsToInsertDB.length > 0) {
        localStorage.setItem(myPetsKey, JSON.stringify(savedPets));
        const { error: dbError } = await supabase
          .from('user_pets')
          .upsert(petsToInsertDB, { onConflict: 'id' });
        if (dbError) {
          console.error("Failed to save pets to DB on checkout:", dbError);
        }
      }

      // 5. Clear Cart in Backend & LocalStorage but KEEP UI state for download
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      localStorage.removeItem('petLink_cart');
      
      setCheckoutCompleted(true);
      showToast("결제가 완료되었습니다! 이제 펫을 다운로드할 수 있습니다 🎉", "success");
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("startWebTutorial"));
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      showToast(error.message || "결제 중 오류가 발생했습니다.", "error");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleFinishAndClear = () => {
    // Refresh page to clear contexts and states
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen font-sans relative text-[var(--color-pet-text)] py-12 px-6 flex flex-col items-center">
      
      {/* Header */}
      <div className="max-w-4xl w-full flex justify-between items-center mb-10 border-b-4 border-[var(--color-pet-point)] pb-6">
        <h1 className="text-5xl font-extrabold tracking-tight">장바구니 🛒</h1>
        <div className="flex gap-4">
          <Link 
            href="/orders" 
            className="px-6 py-3 glass-card hover:bg-[rgba(255,255,255,0.8)] text-[var(--color-pet-text)] font-bold rounded-xl transition-colors flex items-center"
          >
            🧾 최근 구매 내역
          </Link>
          <Link 
            href={user ? "/charge" : "/login"} 
            className="px-6 py-3 glass-card hover:bg-[rgba(255,255,255,0.8)] text-[var(--color-pet-point)] font-bold rounded-xl transition-colors flex items-center"
          >
            🧀 치즈 충전
          </Link>
          <Link href="/" className="px-6 py-3 bg-[var(--color-pet-point)] hover:bg-[#d59868] text-white font-bold rounded-xl transition-colors flex items-center">
            상점으로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-8">
        
        {/* Cart Items List */}
        <div className="flex-1 flex flex-col gap-6">
          {combinedCartItems.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-2xl font-bold text-[var(--color-pet-subtext)] mb-6">장바구니가 텅 비어있어요!</p>
              <Link href="/customize" className="px-8 py-4 bg-[var(--color-pet-point)] hover:bg-[#d59868] text-white rounded-full font-bold text-xl inline-block">
                캐릭터 만들러 가기
              </Link>
            </div>
          ) : (
            combinedCartItems.map((pet, index) => {
              const isCustom = !pet.isShopItem && pet.shopId !== 'human';
              
              const isConsumable = ['bread', 'soap', 'towel', 'strawberry'].includes(pet.shopId);

              const characterProps = {
                frontHairIndex: pet.frontHairIndex || 2,
                backHairIndex: pet.backHairIndex || 1,
                bodyType: pet.bodyType || 1,
                eyeType: pet.eyeType || 1,
                mouthType: pet.mouthType || 1,
                blushType: pet.blushType || 1,
                outfitStyle: pet.outfitStyle || 1,
                hatType: pet.hatType || 1,
                skinColorHex: pet.skinToneValue ? getSkinColorHex(pet.skinToneValue) : '#ffdfc4',
                hairColorHSL: pet.hairColorValue !== undefined ? `hsl(${pet.hairColorValue * 3.6}, 70%, ${pet.hairLightnessValue ?? 50}%)` : 'hsl(30, 70%, 50%)',
                outfitColorHex: pet.outfitColor || '#4287f5',
                backpackColorHex: pet.backpackColor || '#ff9999',
                glassesType: pet.glassesType || 1,
                glassesColorHex: pet.glassesColor || '#1a1a1a',
                backpackType: pet.backpackType ?? 2,
                hideControls: true,
                isWalking: false
              };

              return (
                <div key={pet.id} className="pet-case-card flex flex-col relative group mb-6">
                  <div className="p-6 flex items-center gap-6 z-10 w-full">
                    {/* Remove Button */}
                    <button 
                      onClick={() => handleRemove(pet.id, pet.isContextItem)}
                      className="absolute top-4 right-4 text-[var(--color-pet-subtext)] hover:text-red-500 transition-colors z-20"
                    >
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Preview (Small) */}
                    <div className="w-40 h-40 pet-display-area p-0 relative flex items-center justify-center shrink-0">
                    {pet.shopId === 'dedenne' ? (
                      <img src="/assets/dedenne/basic.png" alt="Dedenne" className="w-24 h-24 object-contain" />
                    ) : isConsumable ? (
                      <span className="text-6xl">{pet.emoji}</span>
                    ) : pet.isShopItem ? (
                      <Universal3DViewer 
                        species={pet.shopId} 
                        animationState="idle" 
                        trackMouse={false} 
                        characterSize={130}
                        containerClassName="w-full h-full" 
                      />
                    ) : pet.type === 'animal' ? (
                      <Universal3DViewer 
                        species={pet.species} 
                        furColor={pet.furColor}
                        animationState="idle" 
                        trackMouse={false} 
                        characterSize={130}
                        containerClassName="w-full h-full" 
                      />
                    ) : (
                      <Character3D {...characterProps} />
                    )}
                  </div>

                  {/* Info & Download Button */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-3xl font-black mb-2">{pet.name}</h2>
                    <p className="text-[var(--color-pet-subtext)] font-bold mb-4">
                      {pet.isShopItem ? "기본 상점 아이템 (Shop Item)" : "커스텀 캐릭터 (Customized Pet)"}
                    </p>
                    
                    {!isConsumable && !checkoutCompleted && (
                      <div className="px-6 py-3 bg-gray-300 text-gray-500 rounded-xl font-bold flex items-center gap-2 w-max shadow-sm">
                        🔒 결제 후 다운로드 가능
                      </div>
                    )}
                    
                    {!isConsumable && checkoutCompleted && (
                      <button 
                        onClick={() => handleDownloadPetData(pet)}
                        disabled={isDownloading[pet.id]}
                        className="px-6 py-3 bg-[#8c4a23] hover:bg-[#733c1c] disabled:bg-gray-400 text-white rounded-xl font-bold flex items-center gap-2 w-max shadow-sm transition-transform hover:scale-105 disabled:scale-100 animate-fade-in"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {isDownloading[pet.id] ? "패키징 및 빌드 중..." : "PC 펫 플레이어 다운로드 (.zip)"}
                      </button>
                    )}
                  </div>

                  <div className="pr-10 flex flex-col items-end gap-3 shrink-0">
                    <span className="text-2xl font-black text-[var(--color-pet-point)]">{pet.price === 0 ? "무료" : `🧀 ${(pet.price ?? 10).toLocaleString()} 개`}</span>
                    {pet.isShopItem && !checkoutCompleted && (
                      <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.5)] rounded-full p-1 border-2 border-[rgba(255,255,255,0.6)]">
                        <button 
                          onClick={() => setQuantity(pet.id, getQuantity(pet.id) - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-xl font-black hover:bg-[rgba(255,255,255,0.8)] transition-colors text-[var(--color-pet-text)]"
                        >
                          -
                        </button>
                        <span className="font-bold text-lg w-4 text-center">{getQuantity(pet.id)}</span>
                        <button 
                          onClick={() => setQuantity(pet.id, getQuantity(pet.id) + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-xl font-black hover:bg-[rgba(255,255,255,0.8)] transition-colors text-[var(--color-pet-text)]"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                  </div>
                  <div className="pet-case-floor mt-auto"></div>
                </div>
              );
            })
          )}
        </div>

        {/* Checkout Sidebar */}
        {combinedCartItems.length > 0 && (
          <div className="w-full lg:w-[350px] shrink-0">
            <div className="glass-card p-8 sticky top-8">
              <h3 className="text-2xl font-black mb-6 border-b-2 border-[rgba(255,255,255,0.6)] pb-4">결제 정보</h3>
              
              <div className="flex justify-between items-center mb-4 font-bold text-[var(--color-pet-subtext)]">
                <span>총 아이템:</span>
                <span>{totalItemsCount} 개</span>
              </div>
              
              <div className="flex justify-between items-center mb-8 font-black text-2xl">
                <span>총 결제 치즈:</span>
                <span className="text-[var(--color-pet-point)]">🧀 {totalPrice.toLocaleString()} 개</span>
              </div>

              {!checkoutCompleted ? (
                <button
                  onClick={handleCheckout}
                  disabled={isCheckoutLoading || combinedCartItems.length === 0}
                  className="w-full py-4 bg-[#c44933] hover:bg-[#a33926] disabled:bg-gray-400 text-white rounded-2xl font-bold text-xl shadow-lg transition-transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isCheckoutLoading ? (
                    <>
                      <span className="animate-bounce inline-block text-2xl mr-2">🐾</span>
                      결제 진행 중...
                    </>
                  ) : (
                    "결제하기"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleFinishAndClear}
                  className="w-full py-4 bg-[#8c4a23] hover:bg-[#733c1c] text-white rounded-xl font-black text-xl shadow-md transition-colors"
                >
                  상점으로 돌아가기
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {checkoutToast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] px-6 py-3 rounded-full font-bold shadow-xl text-white text-sm flex items-center gap-2 transition-all animate-fade-in ${
            checkoutToast.type === "success"
              ? "bg-[#8c4a23]"
              : checkoutToast.type === "warning"
              ? "bg-[#e07a5f]"
              : "bg-red-500"
          }`}
        >
          {checkoutToast.message}
        </div>
      )}
    </div>
  );
}
