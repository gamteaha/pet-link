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
  const [showManualPetId, setShowManualPetId] = useState<string | null>(null);
  const [petData, setPetData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  const loadInventoryData = async (petConfigId: string | null) => {
    try {
      const pet = myPets.find(p => p.id === petConfigId);
      const petDbId = pet?.db_id;

      // 1. 공용 가방 (user_inventory.quantity)
      const { data: invData } = await supabase
        .from('user_inventory')
        .select('item_id, quantity')
        .eq('user_id', user?.id)
        .in('item_id', Object.keys(ITEMS));

      const webInv: Record<string, number> = {};
      Object.keys(ITEMS).forEach(k => { 
        webInv[k] = 0; 
      });

      if (invData) {
        invData.forEach(row => { 
          webInv[row.item_id] = row.quantity || 0; 
        });
      }

      setWebInventory({ ...webInv });

      setPetData(pet || null);
    } catch (err) {
      console.error("Failed to load inventory data:", err);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Realtime: 데스크톱 앱에서 아이템 사용 시 웹에서도 즉시 반영
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`web_user_inventory:${user.id}`)
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'user_inventory',
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        const newRow = payload.new;
        if (newRow && ITEMS[newRow.item_id] !== undefined) {
          setWebInventory(prev => ({ ...prev, [newRow.item_id]: newRow.quantity || 0 }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, supabase]);

  const handleDownloadPetData = async (pet: any) => {
    setIsDownloading((prev) => ({ ...prev, [pet.id]: true }));
    try {
      const isDedenne = pet.shopId === 'dedenne' || pet.name === '데덴네';
      const zipName = isDedenne ? 'dedenne-desktop-pet.zip' : 'custom-pet-player.zip';
      const response = await fetch(`/releases/${zipName}?t=${Date.now()}`);
      if (!response.ok) throw new Error(`Failed to fetch ${zipName}`);
      const blob = await response.blob();

      const zip = await JSZip.loadAsync(blob);
      
      // 3. Inject the pet's configuration AND inventory as 'character.petlink' inside the zip
      const petWithInventory = {
        ...pet,
        user_id: user.id,
        inventory: { ...webInventory },
        downloadedAt: Date.now(),
        serverUrl: typeof window !== "undefined" ? window.location.origin : "https://pet-link-1mrv.vercel.app"
      };
      const dataStr = JSON.stringify(petWithInventory, null, 2);
      
      const targetFileName = isDedenne ? "pet_data.json" : "pet-player/character.petlink";
      zip.file(targetFileName, dataStr);
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = isDedenne ? `dedenne_pet.zip` : `${pet.name || 'custom_pet'}_player.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating custom pet player zip:", error);
      const petWithInventory = {
        ...pet,
        inventory: { ...webInventory },
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
                <h2 className="text-3xl font-black flex items-center gap-2">🎒 내 아이템 (공용 가방)</h2>
                <p className="text-[#a68a7e] font-bold mt-2">상점에서 구매한 아이템들이 모든 펫에게 공유됩니다.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-[#fdf6e3] rounded-2xl p-6 border-[3px] border-[#d0b8a0]">
                <div className="space-y-3">
                  {Object.entries(ITEMS).map(([id, info]) => {
                    const qty = webInventory[id] || 0;
                    return (
                      <div key={id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#e8dac1]">
                        <span className="text-4xl">{info.emoji}</span>
                        <div>
                          <p className="font-bold text-lg leading-tight">{info.name}</p>
                          <p className="text-[#e07a5f] font-black">{qty}개</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Helpful Note for Updates */}
              <div className="mt-4 bg-[#fff4e6] p-4 rounded-xl border border-[#ffd8a8] flex gap-3 items-center">
                <span className="text-2xl">💡</span>
                <p className="text-sm text-[#d9480f] font-bold">
                  방금 구매한 아이템이 데스크톱 펫의 가방에 나타나지 않나요?<br/>
                  <span className="font-normal text-[#e8590c]">목록에서 [PC 펫 플레이어 재다운로드]를 눌러 펫 앱을 최신 버전으로 업데이트 해보세요!</span>
                </p>
              </div>
            </div>
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

                    {/* Pet Status Display */}
                    <div className="flex flex-col items-start w-full max-w-[200px] mb-4">
                      <div className="flex justify-between w-full mb-1">
                        <span className="font-bold text-[#e07a5f] text-xs">❤️ {pet.affection || 0} / 100</span>
                        <span className="font-bold text-[#e07a5f] text-xs">Lv.{pet.level || 1}</span>
                      </div>
                      <div className="w-full h-2 bg-[#e8dac1] rounded-full overflow-hidden border border-[#d0b8a0]">
                        <div
                          className="h-full bg-gradient-to-r from-[#e07a5f] to-[#f4a58a] rounded-full transition-all duration-500"
                          style={{ width: `${pet.affection || 0}%` }}
                        />
                      </div>
                    </div>
                    
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
                        onClick={() => setShowManualPetId(pet.shopId)}
                        className="px-4 py-3 bg-[#f8eedb] hover:bg-[#e8dac1] text-[#8c4a23] border-2 border-[#e8dac1] rounded-xl font-bold flex items-center gap-2 shadow-sm transition-transform hover:scale-105"
                        title="설치 및 사용 가이드 보기"
                      >
                        💡 가이드 보기
                      </button>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => handleDeletePet(pet.db_id, pet.id)}
                        className="px-6 py-3 rounded-xl font-bold border-2 border-red-500 text-red-500 hover:bg-red-50 shadow-sm transition-colors flex items-center justify-center gap-2 w-full"
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
      {showManualPetId && (
        <ManualModal 
          isDedenne={showManualPetId === 'dedenne'} 
          onClose={() => setShowManualPetId(null)} 
        />
      )}
    </div>
  );
}
