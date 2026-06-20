"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Character3D from "../components/Character3D";
import CharacterWithEyes from "../components/CharacterWithEyes";
import Universal3DViewer from "../components/characters/Universal3DViewer";
import JSZip from "jszip";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { createClient } from "../../utils/supabase/client";
import ManualModal from "./components/ManualModal";

function getSkinColorHex(value: number) {
  const r = Math.round(255 - (255 - 74) * (value / 100));
  const g = Math.round(224 - (224 - 46) * (value / 100));
  const b = Math.round(196 - (196 - 27) * (value / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const ITEMS: Record<string, { name: string; emoji: string }> = {
  bread: { name: "맛있는 식빵", emoji: "🍞" },
  strawberry: { name: "상큼한 딸기", emoji: "🍓" },
  soap: { name: "몽글몽글 비누", emoji: "🧼" },
  towel: { name: "부드러운 수건", emoji: "🧻" },
};

export default function MyPetsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [myPets, setMyPets] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState<Record<number, boolean>>({});

  // Inventory Transfer States
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [webInventory, setWebInventory] = useState<Record<string, number>>({});
  const [originalWebInventory, setOriginalWebInventory] = useState<Record<string, number>>({});
  const [showManual, setShowManual] = useState(false);
  const [petBag, setPetBag] = useState<Record<string, number>>({});
  const [petData, setPetData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 튜토리얼 스텝 수신 (WebTutorial에서 broadcast)
  const [tutorialStep, setTutorialStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return (window as any).__tutorialStep || 0;
  });
  useEffect(() => {
    const handler = (e: Event) => setTutorialStep((e as CustomEvent).detail);
    window.addEventListener('tutorialStepChange', handler);
    return () => window.removeEventListener('tutorialStepChange', handler);
  }, []);

  // Original items mapping to track if changed
  const [originalPetBag, setOriginalPetBag] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
      return;
    }
    if (!user) return;
    
    const fetchPets = async () => {
      let combinedPets: any[] = [];
      const { data, error } = await supabase
        .from('user_pets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        combinedPets = data.map(row => ({
          ...row.config,
          db_id: row.id
        }));
      }

      // Merge with localStorage pets (like previously bought shop items)
      const savedPetsStr = localStorage.getItem(`petLink_myPets_${user.id}`);
      if (savedPetsStr) {
        const localPets = JSON.parse(savedPetsStr);
        for (const localPet of localPets) {
          // If local pet doesn't exist in DB, insert it!
          if (!combinedPets.find(p => p.id === localPet.id)) {
            const { data: insertedPet, error: insertError } = await supabase
              .from('user_pets')
              .insert({
                user_id: user.id,
                config: { ...localPet, inventory: localPet.inventory || {} }
              })
              .select()
              .single();
              
            if (!insertError && insertedPet) {
              combinedPets.push({ ...localPet, inventory: localPet.inventory || {}, db_id: insertedPet.id });
            } else {
              combinedPets.push(localPet); // fallback
            }
          }
        }
      }

      setMyPets(combinedPets);
    };
    
    fetchPets();

    if (user) {
      loadInventoryData(selectedPetId);
    }
  }, [user, isLoading, router, selectedPetId]);

  const loadInventoryData = async (petId: string | null) => {
    try {
      // 1. Load Web Warehouse (Supabase)
      const { data: invData, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', user?.id)
        .in('item_id', Object.keys(ITEMS));

      const webInv: Record<string, number> = {};
      if (invData) {
        invData.forEach((row) => {
          webInv[row.item_id] = row.quantity;
        });
      }
      setWebInventory({ ...webInv });
      setOriginalWebInventory({ ...webInv });
      
      // 2. Load Local Pet Bag from Supabase user_pets.config
      const pet = myPets.find(p => p.id === petId);
      if (pet) {
        // pet is already the config object (with db_id)
        setPetData(pet);
        
        const bag = pet.inventory || {};
        const localInv: Record<string, number> = {};
        Object.keys(ITEMS).forEach((id) => {
          localInv[id] = bag[id] || 0;
        });
        setPetBag({ ...localInv });
        setOriginalPetBag({ ...localInv });
      } else {
        setPetData(null);
        setPetBag({});
        setOriginalPetBag({});
      }
    } catch (err) {
      console.error("Failed to load inventory data:", err);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const moveItem = (itemId: string, direction: 'to-bag' | 'to-web') => {
    if (direction === 'to-bag') {
      const currentWeb = webInventory[itemId] || 0;
      if (currentWeb > 0) {
        setWebInventory(prev => ({ ...prev, [itemId]: currentWeb - 1 }));
        setPetBag(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
      }
    } else {
      const currentBag = petBag[itemId] || 0;
      if (currentBag > 0) {
        setPetBag(prev => ({ ...prev, [itemId]: currentBag - 1 }));
        setWebInventory(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
      }
    }
  };

  const handleSaveInventory = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // 1. Save to Supabase
      const inventoryUpserts = Object.keys(ITEMS).map((itemId) => ({
        user_id: user.id,
        item_id: itemId,
        quantity: webInventory[itemId] || 0,
        updated_at: new Date().toISOString()
      }));

      const { error: invError } = await supabase
        .from('user_inventory')
        .upsert(inventoryUpserts, { onConflict: 'user_id, item_id' });

      if (invError) throw invError;

      // 2. Save to Supabase user_pets.config
      if (selectedPetId) {
        const petToUpdate = myPets.find(p => p.id === selectedPetId);
        if (petToUpdate) {
          const { db_id, ...configWithoutDbId } = petToUpdate;
          const newConfig = {
            ...configWithoutDbId,
            inventory: { ...petBag },
            updatedAt: Date.now()
          };
          
          if (db_id) {
            const { error: petUpdateError } = await supabase
              .from('user_pets')
              .update({ config: newConfig })
              .eq('id', db_id);
              
            if (petUpdateError) throw petUpdateError;
          }
          
          const updatedPets = myPets.map(p => p.id === selectedPetId ? { ...newConfig, db_id } : p);
          setMyPets(updatedPets);
          setPetData(newConfig);
          
          // If we happen to be in electron (though rare for my-pets page), also sync local disk
          if (typeof window !== "undefined" && (window as any).electronAPI?.savePetData) {
            await (window as any).electronAPI.savePetData({ ...newConfig, db_id });
          }

          // Legacy Python app sync: Also sync local python app's pet_data.json if running locally
          try {
            await fetch('/api/python/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ config: { ...newConfig, db_id } })
            });
          } catch (e) {
            // Ignore error if python app sync fails (e.g. deployed on vercel)
          }
        }
      }

      setOriginalWebInventory({ ...webInventory });
      setOriginalPetBag({ ...petBag });
      showToast("인벤토리 저장이 완료되었습니다! 🎉");
    } catch (err) {
      console.error("Save error:", err);
      showToast("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = JSON.stringify(webInventory) !== JSON.stringify(originalWebInventory);

  const handleDownloadPetData = async (pet: any) => {
    setIsDownloading((prev) => ({ ...prev, [pet.id]: true }));
    try {
      const response = await fetch("/releases/custom-pet-player.zip");
      if (!response.ok) throw new Error("Failed to fetch custom player package.");
      const blob = await response.blob();

      const zip = await JSZip.loadAsync(blob);
      
      // 3. Inject the pet's configuration AND inventory as 'character.petlink' inside the zip
      // pet is already the config object augmented with db_id
      const petWithInventory = {
        ...pet,
        inventory: { ...(pet.inventory || {}) },
        downloadedAt: Date.now(),
        serverUrl: typeof window !== "undefined" ? window.location.origin : "https://pet-link-1mrv.vercel.app"
      };
      const dataStr = JSON.stringify(petWithInventory, null, 2);
      zip.file("pet-player/character.petlink", dataStr);
      const content = await zip.generateAsync({ type: "blob" });
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
      const petWithInventory = {
        ...pet,
        inventory: { ...(pet.inventory || {}) },
        downloadedAt: Date.now()
      };
      const dataStr = JSON.stringify(petWithInventory, null, 2);
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

  const handleDeletePet = async (db_id: string | undefined, localId: string) => {
    if (!confirm("정말 이 펫을 삭제하시겠습니까?")) return;
    
    if (db_id) {
      await supabase.from('user_pets').delete().eq('id', db_id);
    }
    
    const updatedPets = myPets.filter(p => p.id !== localId);
    setMyPets(updatedPets);
    if (user) {
      localStorage.setItem(`petLink_myPets_${user.id}`, JSON.stringify(updatedPets));
    }
    showToast("펫이 삭제되었습니다.");
  };

  if (isLoading || !user) {
    return <div className="min-h-screen bg-[#fdf6e3]"></div>;
  }

  const affection = petData?.affection ?? 0;
  const level = petData?.level ?? 1;

  return (
    <div className="min-h-screen bg-[#fdf6e3] font-sans text-[#4a2e1b] py-12 px-6 flex flex-col items-center">
      <div className="max-w-6xl w-full flex justify-between items-center mb-10 border-b-4 border-[#e8dac1] pb-6">
        <h1 className="text-5xl font-extrabold tracking-tight">나의 펫 🐾</h1>
        <Link href="/" className="px-6 py-3 bg-white hover:bg-[#f8eedb] text-[#4a2e1b] border-2 border-[#e8dac1] font-bold rounded-xl transition-colors">
          홈으로 가기
        </Link>
      </div>

      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Inventory Transfer System */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-[#e8dac1]">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-3xl font-black flex items-center gap-2">📦 내 창고 연동</h2>
                <p className="text-[#a68a7e] font-bold mt-2">상점에서 구매한 아이템을 캐릭터 가방으로 옮겨주세요.</p>
              </div>
              <button
                onClick={handleSaveInventory}
                disabled={!hasUnsavedChanges || isSaving}
                className={`px-6 py-3 rounded-xl font-black text-lg transition-colors shadow-sm flex items-center gap-2 ${
                  hasUnsavedChanges
                    ? "bg-[#c44933] hover:bg-[#a33926] text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                } ${tutorialStep === 4 ? "ring-4 ring-offset-2 ring-[#e07a5f] animate-pulse" : ""}`}
              >
                {isSaving ? "저장 중..." : "💾 변경사항 저장"}
              </button>
            </div>

            {!selectedPetId ? (
              <div className="bg-[#f8eedb] p-10 rounded-2xl border-2 border-[#e8dac1] text-center flex flex-col items-center justify-center h-64">
                <span className="text-6xl mb-4">👈</span>
                <p className="text-[#8c4a23] font-bold text-xl mb-2">어떤 펫의 가방을 열어볼까요?</p>
                <p className="text-sm text-[#a68a7e]">
                  오른쪽 목록에서 가방을 열고 싶은 캐릭터의<br/>
                  <strong>[🎒 이 캐릭터의 가방 관리]</strong> 버튼을 눌러주세요.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Pet Status Header */}
                <div className="bg-[#fdf6e3] p-4 rounded-xl border-2 border-[#e8dac1] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">💝</span>
                    <div>
                      <p className="font-bold text-[#4a2e1b]">현재 펫 신뢰도</p>
                      <p className="text-sm text-[#a68a7e]">Lv.{level}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end w-1/2">
                    <p className="font-bold text-[#e07a5f] mb-1">❤️ {affection} / 100</p>
                    <div className="w-full h-3 bg-[#e8dac1] rounded-full overflow-hidden border border-[#d0b8a0]">
                      <div
                        className="h-full bg-gradient-to-r from-[#e07a5f] to-[#f4a58a] rounded-full transition-all duration-500"
                        style={{ width: `${affection}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Transfer UI */}
                <div className="flex gap-4 items-stretch mt-4">
                  
                  {/* Web Warehouse */}
                  <div className="flex-1 bg-[#fdf6e3] rounded-2xl p-4 border-[3px] border-[#d0b8a0]">
                    <h3 className="text-center font-black text-xl mb-4 pb-2 border-b-2 border-[#e8dac1]">웹 창고 ☁️</h3>
                    <div className="space-y-3">
                      {Object.entries(ITEMS).map(([id, info]) => {
                        const qty = webInventory[id] || 0;
                        return (
                          <div key={id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#e8dac1]">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{info.emoji}</span>
                              <div>
                                <p className="font-bold text-sm leading-tight">{info.name}</p>
                                <p className="text-[#a68a7e] text-xs">{qty}개</p>
                              </div>
                            </div>
                            <button
                               onClick={() => moveItem(id, 'to-bag')}
                              disabled={qty <= 0}
                              className={`w-8 h-8 flex items-center justify-center bg-[#8c4a23] hover:bg-[#733c1c] disabled:bg-[#e8dac1] disabled:text-[#a68a7e] text-white rounded-lg font-black transition-colors ${tutorialStep === 4 && qty > 0 ? "ring-4 ring-offset-1 ring-[#e07a5f] animate-pulse" : ""}`}
                            >
                              ▶
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Character Bag */}
                  <div className="flex-1 bg-[#fdf6e3] rounded-2xl p-4 border-[3px] border-[#d0b8a0]">
                    <h3 className="text-center font-black text-xl mb-4 pb-2 border-b-2 border-[#e8dac1]">캐릭터 가방 🎒</h3>
                    <div className="space-y-3">
                      {Object.entries(ITEMS).map(([id, info]) => {
                        const qty = petBag[id] || 0;
                        return (
                          <div key={id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#e8dac1]">
                            <button
                              onClick={() => moveItem(id, 'to-web')}
                              disabled={qty <= 0}
                              className="w-8 h-8 flex items-center justify-center bg-[#a68a7e] hover:bg-[#8c4a23] disabled:bg-[#e8dac1] disabled:text-[#a68a7e] text-white rounded-lg font-black transition-colors"
                            >
                              ◀
                            </button>
                            <div className="flex items-center gap-2 flex-row-reverse text-right">
                              <span className="text-2xl">{info.emoji}</span>
                              <div>
                                <p className="font-bold text-sm leading-tight">{info.name}</p>
                                <p className="text-[#a68a7e] text-xs">{qty}개</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Helpful Note for Updates */}
                <div className="mt-4 bg-[#fff4e6] p-4 rounded-xl border border-[#ffd8a8] flex gap-3 items-center">
                  <span className="text-2xl">💡</span>
                  <p className="text-sm text-[#d9480f] font-bold">
                    아이템을 저장했는데 데스크톱 펫의 가방에 나타나지 않나요?<br/>
                    <span className="font-normal text-[#e8590c]">목록에서 [PC 펫 플레이어 재다운로드]를 눌러 펫 앱을 최신 버전으로 업데이트 해보세요!</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Character Downloads */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          {myPets.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border-2 border-[#e8dac1]">
              <span className="text-6xl mb-4 block">🥺</span>
              <p className="text-2xl font-bold text-[#a68a7e] mb-6">아직 다운로드하신 커스텀 펫이 없어요.</p>
              <Link href="/customize" className="inline-block px-8 py-4 bg-[#e07a5f] hover:bg-[#d56b50] text-white font-bold rounded-full text-lg shadow-md transition-transform hover:-translate-y-1">
                커스텀 캐릭터 꾸미러 가기
              </Link>
            </div>
          ) : (
            myPets.map((pet) => {
              const characterProps = {
                frontHairIndex: pet.frontHairIndex || 2, // 기본값(기본 뱅)
                backHairIndex: pet.backHairIndex || 1, // 기본값(숏컷)
                bodyType: pet.bodyType,
                eyeType: pet.eyeType,
                mouthType: pet.mouthType,
                blushType: pet.blushType,
                outfitStyle: pet.outfitStyle,
                hatType: pet.hatType,
                glassesType: pet.glassesType || 1,
                glassesColorHex: pet.glassesColor || "#1a1a1a",
                backpackType: pet.backpackType || 1,
                skinColorHex: getSkinColorHex(pet.skinToneValue),
                hairColorHSL: `hsl(${pet.hairColorValue * 3.6}, 70%, 50%)`,
                outfitColorHex: pet.outfitColor,
                backpackColorHex: pet.backpackColor,
                hideControls: true,
              };

              return (
                <div key={pet.id} className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-[#e8dac1] flex items-center gap-8">
                  <div className="w-40 h-40 bg-[#f8eedb] rounded-2xl relative flex items-center justify-center overflow-hidden shrink-0 border-[3px] border-[#e8dac1]">
                    <CharacterWithEyes 
                      className="w-full h-full" 
                      onFeed={() => {
                        // refresh local state slightly or let the user see it
                        loadInventoryData(selectedPetId);
                      }}
                    >
                      {pet.shopId === 'dedenne' ? (
                        <img src="/assets/dedenne/basic.png" alt="Dedenne" className="w-24 h-24 object-contain" />
                      ) : pet.shopId === 'cat' ? (
                        <span className="text-6xl">🐱</span>
                      ) : pet.shopId === 'human' ? (
                        <span className="text-6xl">🧑‍🌾</span>
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
                          containerClassName="w-full h-full pointer-events-none" 
                        />
                      ) : (
                        <div className="w-full h-full pointer-events-none">
                          <Character3D {...characterProps} />
                        </div>
                      )}
                    </CharacterWithEyes>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-3xl font-black mb-2">{pet.name}</h2>
                    <p className="text-[#a68a7e] font-bold mb-4">
                      {pet.isShopItem ? "기본 상점 아이템 (Shop Item)" : "커스텀 캐릭터 (Customized Pet)"}
                    </p>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDownloadPetData(pet)}
                        disabled={isDownloading[pet.id]}
                        className="px-6 py-3 bg-[#8c4a23] hover:bg-[#733c1c] disabled:bg-gray-400 text-white rounded-xl font-bold flex items-center gap-2 w-max shadow-sm transition-transform hover:scale-105 disabled:scale-100"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {isDownloading[pet.id] ? "패키징 및 빌드 중..." : pet.isShopItem ? "PC 펫 플레이어 다운로드 (.zip)" : "PC 펫 플레이어 재다운로드 (.zip)"}
                      </button>

                      <button 
                        onClick={() => setShowManual(true)}
                        className="px-4 py-3 bg-[#f8eedb] hover:bg-[#e8dac1] text-[#8c4a23] border-2 border-[#e8dac1] rounded-xl font-bold flex items-center gap-2 shadow-sm transition-transform hover:scale-105"
                        title="설치 및 사용 가이드 보기"
                      >
                        💡 가이드 보기
                      </button>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button 
                        data-tutorial-target="bag-btn"
                        onClick={() => {
                          setSelectedPetId(pet.id);
                          if (typeof window !== "undefined" && (window as any).__tutorialAdvanceToStep4) {
                            (window as any).__tutorialAdvanceToStep4();
                          }
                        }}
                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 w-max shadow-sm transition-all ${
                          selectedPetId === pet.id 
                            ? "bg-[#e07a5f] text-white border-2 border-[#c44933]" 
                            : "bg-white border-2 border-[#e07a5f] text-[#e07a5f] hover:bg-[#fff0f5]"
                        } ${tutorialStep === 3 && myPets.indexOf(pet) === 0 ? "ring-4 ring-offset-2 ring-[#e07a5f] animate-pulse" : ""}`}
                      >
                        🎒 이 캐릭터의 가방 관리
                      </button>
                      
                      <button 
                        onClick={() => handleDeletePet(pet.db_id, pet.id)}
                        className="px-6 py-3 rounded-xl font-bold border-2 border-red-500 text-red-500 hover:bg-red-50 shadow-sm transition-colors flex items-center justify-center gap-2"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>

      </div>

      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-xl bg-[#4a2e1b] text-white text-sm animate-fade-in">
          {toastMsg}
        </div>
      )}
      {/* Manual Modal */}
      {showManual && (
        <ManualModal onClose={() => setShowManual(false)} />
      )}
    </div>
  );
}
