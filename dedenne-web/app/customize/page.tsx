"use client";

import React, { useState } from "react";
import Link from "next/link";
import Character3D from "../components/Character3D";
import CustomPet from "../components/CustomPet";
import Universal3DViewer from "../components/characters/Universal3DViewer";

// Colors for the palettes
const OUTFIT_COLORS = ['#c44933', '#e8ab48', '#b5d5a4', '#a1adc8', '#d4b7d5', '#ebb1b1'];
const BACKPACK_COLORS = ['#c44933', '#e8ab48', '#b5d5a4', '#a1adc8', '#d4b7d5', '#ebb1b1'];
const GLASSES_COLORS = ['#1a1a1a', '#e0e0e0', '#ffd700', '#c44933', '#4a6fa5', '#d4b7d5'];

const CATEGORIES = [
  { id: 'basic', label: '기본' },
  { id: 'face', label: '얼굴' },
  { id: 'hair', label: '헤어' },
  { id: 'outfit', label: '의상' },
  { id: 'acc', label: '소품' },
  { id: 'voice', label: '목소리' },
];

const CAT_FUR_COLORS = [
  { name: '라벤더', value: '#A89BC0' },
  { name: '오렌지', value: '#E8956D' },
  { name: '밝은 회색', value: '#F0EDE8' },
  { name: '검정', value: '#3D3D3D' },
  { name: '갈색', value: '#C8A882' },
  { name: '회색', value: '#9B9B9B' },
];

const DOG_FUR_COLORS = [
  { name: '라벤더', value: '#A89BC0' },
  { name: '오렌지', value: '#E8956D' },
  { name: '밝은 갈색', value: '#F0EDE8' },
  { name: '검정', value: '#3D3D3D' },
  { name: '갈색', value: '#C8A882' },
  { name: '회색', value: '#9B9B9B' },
];

export default function CustomizePage() {
  const [isMounted, setIsMounted] = useState(false);

  // Initial state setup with lazy evaluation from localStorage
  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).name || "";
    }
    return "";
  });
  const [activeTab, setActiveTab] = useState('basic');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [characterType, setCharacterType] = useState<'human' | 'cat' | 'dog'>('human');
  const [furColor, setFurColor] = useState(CAT_FUR_COLORS[0].value);

  // States
  const [hairColorValue, setHairColorValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).hairColorValue || 15;
    }
    return 15;
  });
  const [hairLightnessValue, setHairLightnessValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).hairLightnessValue || 50;
    }
    return 50;
  });
  const [skinToneValue, setSkinToneValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).skinToneValue || 30;
    }
    return 30;
  });
  const [outfitColor, setOutfitColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).outfitColor || OUTFIT_COLORS[1];
    }
    return OUTFIT_COLORS[1];
  });
  const [backpackColor, setBackpackColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).backpackColor || BACKPACK_COLORS[2];
    }
    return BACKPACK_COLORS[2];
  });

  const [backHairIndex, setBackHairIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).backHairIndex || 1;
    }
    return 1;
  });
  const [frontHairIndex, setFrontHairIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).frontHairIndex || 2;
    }
    return 2;
  });
  const [bodyType, setBodyType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).bodyType || 1;
    }
    return 1;
  });
  const [eyeType, setEyeType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).eyeType || 1;
    }
    return 1;
  });
  const [mouthType, setMouthType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).mouthType || 2;
    }
    return 2;
  });
  const [blushType, setBlushType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).blushType || 1;
    }
    return 1;
  });
  const [outfitStyle, setOutfitStyle] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).outfitStyle || 1;
    }
    return 1;
  });
  const [hatType, setHatType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).hatType || 1;
    }
    return 1;
  });
  const [glassesType, setGlassesType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).glassesType || 1;
    }
    return 1;
  });
  const [glassesColor, setGlassesColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).glassesColor || GLASSES_COLORS[0];
    }
    return GLASSES_COLORS[0];
  });
  const [backpackType, setBackpackType] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).backpackType || 2;
    }
    return 2;
  });

  const [characterSize, setCharacterSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).characterSize || 100;
    }
    return 100;
  });

  const [pronoun, setPronoun] = useState(() => {
    if (typeof window !== 'undefined') {
      const draft = localStorage.getItem('petLink_draftCustomPet');
      if (draft) return JSON.parse(draft).pronoun || 'them';
    }
    return 'them';
  });

  // 현재 커스텀 설정 객체
  const currentConfig = {
    type: (characterType === 'cat' || characterType === 'dog') ? 'animal' : undefined,
    species: (characterType === 'cat' || characterType === 'dog') ? characterType : undefined,
    furColor: (characterType === 'cat' || characterType === 'dog') ? furColor : undefined,
    name, skinToneValue, characterSize, bodyType, pronoun, eyeType, mouthType, blushType,
    frontHairIndex, backHairIndex, hairColorValue, hairLightnessValue,
    outfitStyle, outfitColor, hatType, backpackType, backpackColor, glassesType, glassesColor,
    voice: { name: voiceType, pitch: voicePitch, speakingRate: voiceRate }
  };

  React.useEffect(() => {
    if (isMounted) {
      localStorage.setItem('petLink_draftCustomPet', JSON.stringify(currentConfig));
    }
  }, [isMounted, currentConfig]);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="min-h-screen bg-[#ff9b49]" />;

  // Derived colors
  const hairColorHSL = `hsl(${hairColorValue * 3.6}, 70%, ${hairLightnessValue}%)`;
  const getSkinColor = (val: number) => {
    const r = Math.round(255 - (255 - 74) * (val / 100));
    const g = Math.round(224 - (224 - 46) * (val / 100));
    const b = Math.round(196 - (196 - 27) * (val / 100));
    return `rgb(${r},${g},${b})`;
  };
  const skinColorHex = getSkinColor(skinToneValue);

  return (
    <div className="min-h-screen bg-[#ff9b49] py-12 px-4 md:px-8 flex flex-col items-center justify-center font-sans relative overflow-x-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8c4a23 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

      {/* Logo & Title */}
      <div className="absolute top-8 left-8 z-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border-[3px] border-[#4a2e1b]">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="text-white font-black text-3xl tracking-wider" style={{ textShadow: '2px 2px 0 #4a2e1b, -2px -2px 0 #4a2e1b, 2px -2px 0 #4a2e1b, -2px 2px 0 #4a2e1b' }}>
            PET LINK <span className="text-[#ffe0c4] text-2xl ml-2">캐릭터 커스텀</span>
          </h1>
        </Link>
      </div>

      <div className="max-w-[1400px] w-full flex flex-col md:flex-row gap-12 relative z-10 items-center justify-center mt-16 md:mt-0">

        {/* Left Column: Character & Name */}
        <div className="flex flex-col gap-6 w-full md:w-[600px]">
          <div className="bg-[#b8a69e] border-[#4a2e1b] border-[8px] rounded-[3.5rem] p-4 aspect-square relative flex flex-col items-center justify-center shadow-lg">

            {(characterType === 'cat' || characterType === 'dog') ? (
              <Universal3DViewer species={characterType} animationState="idle" furColor={furColor} characterSize={100} />
            ) : (
              <Character3D {...currentConfig} skinColorHex={skinColorHex} hairColorHSL={hairColorHSL} outfitColorHex={outfitColor} backpackColorHex={backpackColor} />
            )}

            <div className="absolute bottom-4 left-0 w-full text-center text-[#4a2e1b]/40 font-bold text-sm pointer-events-none">
              마우스를 드래그해서 돌려보세요!
            </div>
          </div>

          <div className="bg-[#faefdf] border-[#4a2e1b] border-[6px] rounded-[2rem] px-8 py-6 flex flex-col gap-2 shadow-lg">
            <div className="flex items-center gap-6">
              <span className="text-[#4a2e1b] font-black text-3xl tracking-wide">name:</span>
              <input
                type="text"
                placeholder="your-name"
                value={name}
                onChange={(e) => {
                  // 영문(a-z, A-Z), 숫자(0-9), 하이픈(-), 언더스코어(_)만 허용
                  const filtered = e.target.value.replace(/[^a-zA-Z0-9\-_]/g, '');
                  setName(filtered);
                }}
                maxLength={20}
                className="bg-transparent border-none outline-none text-[#9c8477] font-bold text-3xl w-full placeholder-[#c4b3a9]"
              />
            </div>
            <span className="text-xs text-[#c4b3a9] pl-1">영문, 숫자, -, _ 만 사용 가능 (최대 20자)</span>
          </div>

        </div>

        {/* Right Column: Customization Options */}
        <div className="flex flex-col gap-4 w-full md:w-[700px]">
          {/* Main Type Toggles */}
          <div className="flex bg-[#faefdf] border-[#4a2e1b] border-[6px] rounded-3xl p-2 shadow-lg w-full gap-2 mb-2">
            <button
              onClick={() => { setCharacterType('human'); setActiveTab('basic'); }}
              className={`flex-1 md:px-8 py-3 rounded-2xl font-black text-xl transition-all ${characterType === 'human' ? 'bg-[#c44933] text-white shadow-md' : 'text-[#4a2e1b] hover:bg-[#e2d5c4]'}`}
            >
              사람
            </button>
            <button
              onClick={() => { setCharacterType('cat'); setActiveTab('cat-basic'); setFurColor('#E8E8E8'); }}
              className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 p-4 rounded-[2rem] font-black transition-all ${characterType === 'cat' ? 'bg-[#c44933] text-white shadow-[0_8px_0_#8c3220] scale-105' : 'bg-[#e8dac1] text-[#4a2e1b] hover:bg-[#d4c5b2] shadow-[0_8px_0_#b3a593]'}`}
            >
              <span className="text-3xl md:text-4xl">🐱</span>
              <span className="text-xl md:text-2xl">고양이</span>
            </button>
            <button
              onClick={() => { setCharacterType('dog'); setActiveTab('dog-basic'); setFurColor('#D4A574'); }}
              className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 p-4 rounded-[2rem] font-black transition-all ${characterType === 'dog' ? 'bg-[#c44933] text-white shadow-[0_8px_0_#8c3220] scale-105' : 'bg-[#e8dac1] text-[#4a2e1b] hover:bg-[#d4c5b2] shadow-[0_8px_0_#b3a593]'}`}
            >
              <span className="text-3xl md:text-4xl">🐶</span>
              <span className="text-xl md:text-2xl">강아지</span>
            </button>
          </div>

          {/* Sub Toggles */}
          <div className="flex bg-[#faefdf] border-[#4a2e1b] border-[6px] rounded-3xl p-2 shadow-lg self-center md:self-start w-full md:w-auto gap-2">
            <button
              onClick={() => setIsPreviewing(!isPreviewing)}
              className={`flex-1 md:px-8 py-3 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-2 ${isPreviewing ? 'bg-[#4a2e1b] text-white shadow-md' : 'bg-[#e8dac1] text-[#4a2e1b] hover:bg-[#d4c5b2]'}`}
            >
              {isPreviewing ? "미리보기 끄기" : "미리보기"}
            </button>
          </div>

          {/* Settings Box */}
          <div className="bg-[#faefdf] border-[#4a2e1b] border-[8px] rounded-[3.5rem] p-8 w-full shadow-lg relative flex flex-col h-[780px] max-h-[90vh]">
            {/* Tabs */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-3 scrollbar-hide">
              {(characterType === 'human' ? CATEGORIES : [
                { id: `${characterType}-basic`, label: `${characterType === 'cat' ? '고양이' : '강아지'} 설정` },
                { id: 'voice', label: '목소리' }
              ]).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-6 py-3 rounded-2xl font-bold text-2xl border-[4px] border-[#4a2e1b] whitespace-nowrap transition-colors ${activeTab === cat.id ? 'bg-[#c44933] text-white shadow-inner' : 'bg-[#e2d5c4] text-[#4a2e1b] hover:bg-[#d4c5b2]'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto pr-2 pb-16 flex flex-col gap-10 text-[#4a2e1b] font-black text-2xl customize-scroll">

              {/* Animal Setting */}
              {(activeTab === 'cat-basic' || activeTab === 'dog-basic') && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">털 색상:</span>
                    <div className="flex gap-4 flex-wrap">
                      {(characterType === 'dog' ? DOG_FUR_COLORS : CAT_FUR_COLORS).map(color => (
                        <button
                          key={color.value}
                          onClick={() => setFurColor(color.value)}
                          className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl flex items-center gap-3 ${furColor === color.value ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}
                        >
                          <div className="w-6 h-6 rounded-full border-2 border-[#4a2e1b]" style={{ backgroundColor: color.value }} />
                          {color.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'basic' && (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">캐릭터 크기 (Size): {characterSize}%</span>
                    <input type="range" min="50" max="150" value={characterSize} onChange={(e) => setCharacterSize(Number(e.target.value))} className="w-full accent-[#c44933]" />
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">피부색 (Skin Tone):</span>
                    <input type="range" min="0" max="100" value={skinToneValue} onChange={(e) => setSkinToneValue(Number(e.target.value))} className="w-full h-4 rounded-full appearance-none outline-none" style={{ background: 'linear-gradient(to right, rgb(255,224,196), rgb(74,46,27))' }} />
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">체형 (Body Type):</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '평균' }, { id: 2, label: '길쭉' }, { id: 3, label: '통통' }].map(t => (
                        <button key={t.id} onClick={() => setBodyType(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${bodyType === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">대명사 (Pronouns):</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 'her', label: 'Her' }, { id: 'him', label: 'Him' }, { id: 'them', label: 'Them' }].map(t => (
                        <button key={t.id} onClick={() => setPronoun(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${pronoun === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'face' && (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">눈 모양:</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '기본 눈' }, { id: 2, label: '눈웃음' }, { id: 3, label: '감은 눈' }, { id: 4, label: '초롱초롱 눈' }].map(t => (
                        <button key={t.id} onClick={() => setEyeType(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${eyeType === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">입 모양:</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '없음' }, { id: 2, label: '미소' }, { id: 3, label: '무표정' }, { id: 4, label: '벌린 입' }].map(t => (
                        <button key={t.id} onClick={() => setMouthType(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${mouthType === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">볼따구 (Blush):</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '없음' }, { id: 2, label: '발그레' }, { id: 3, label: '빗금' }].map(t => (
                        <button key={t.id} onClick={() => setBlushType(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${blushType === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hair' && (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">머리색 스펙트럼:</span>
                    <input type="range" min="0" max="100" value={hairColorValue} onChange={(e) => setHairColorValue(Number(e.target.value))} className="w-full h-4 rounded-full appearance-none outline-none" style={{ background: 'linear-gradient(to right, hsl(0,70%,50%), hsl(60,70%,50%), hsl(120,70%,50%), hsl(180,70%,50%), hsl(240,70%,50%), hsl(300,70%,50%), hsl(360,70%,50%))' }} />
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">머리 밝기:</span>
                    <input type="range" min="0" max="100" value={hairLightnessValue} onChange={(e) => setHairLightnessValue(Number(e.target.value))} className="w-full h-4 rounded-full appearance-none outline-none" style={{ background: `linear-gradient(to right, #000000, hsl(${hairColorValue * 3.6}, 70%, 50%), #ffffff)` }} />
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">앞머리:</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '없음' }, { id: 2, label: '뱅 헤어' }, { id: 3, label: '곱슬' }, { id: 4, label: '깻잎머리' }, { id: 6, label: '바보털' }].map(t => (
                        <button key={t.id} onClick={() => setFrontHairIndex(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${frontHairIndex === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">뒷머리:</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '기본' }, { id: 2, label: '양갈래' }, { id: 3, label: '단발' }, { id: 4, label: '긴 양갈래' }, { id: 5, label: '포니테일' }, { id: 6, label: '버섯머리' }, { id: 7, label: '긴 생머리' }, { id: 8, label: '똥머리' }].map(t => (
                        <button key={t.id} onClick={() => setBackHairIndex(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${backHairIndex === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'outfit' && (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">의상 스타일:</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '오버올' }, { id: 2, label: '드레스' }, { id: 3, label: '상하의 분리' }].map(t => (
                        <button key={t.id} onClick={() => setOutfitStyle(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${outfitStyle === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">옷 색상:</span>
                    <div className="flex gap-4 flex-wrap">
                      {OUTFIT_COLORS.map(color => (
                        <button key={color} onClick={() => setOutfitColor(color)} style={{ backgroundColor: color }} className={`w-14 h-14 rounded-2xl border-4 ${outfitColor === color ? 'border-white ring-4 ring-[#4a2e1b]' : 'border-[#4a2e1b]'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'acc' && (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">안경:</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '없음' }, { id: 2, label: '둥근 안경' }, { id: 3, label: '네모 안경' }, { id: 4, label: '반뿔테 안경' }].map(t => (
                        <button key={t.id} onClick={() => setGlassesType(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${glassesType === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">안경 색상:</span>
                    <div className="flex gap-4 flex-wrap">
                      {GLASSES_COLORS.map(color => (
                        <button key={color} onClick={() => setGlassesColor(color)} style={{ backgroundColor: color }} className={`w-12 h-12 rounded-xl border-4 ${glassesColor === color ? 'border-white ring-4 ring-[#4a2e1b]' : 'border-[#4a2e1b]'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">모자:</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '없음' }, { id: 2, label: '버섯 모자' }, { id: 3, label: '비니' }].map(t => (
                        <button key={t.id} onClick={() => setHatType(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${hatType === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">가방:</span>
                    <div className="flex gap-4 flex-wrap">
                      {[{ id: 1, label: '없음' }, { id: 2, label: '백팩' }, { id: 3, label: '손가방' }].map(t => (
                        <button key={t.id} onClick={() => setBackpackType(t.id)} className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${backpackType === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}>{t.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">가방 색상:</span>
                    <div className="flex gap-4 flex-wrap">
                      {BACKPACK_COLORS.map(color => (
                        <button key={color} onClick={() => setBackpackColor(color)} style={{ backgroundColor: color }} className={`w-12 h-12 rounded-xl border-4 ${backpackColor === color ? 'border-white ring-4 ring-[#4a2e1b]' : 'border-[#4a2e1b]'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'voice' && (
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">목소리 유형 (Voice Type):</span>
                    <div className="flex gap-4 flex-wrap">
                      {[
                        { id: 'ko-KR-Standard-A', label: '여성 1 (발랄한)' },
                        { id: 'ko-KR-Standard-B', label: '여성 2 (차분한)' },
                        { id: 'ko-KR-Standard-C', label: '남성 1 (차분한)' },
                        { id: 'ko-KR-Standard-D', label: '남성 2 (활기찬)' }
                      ].map(t => (
                        <button 
                          key={t.id} 
                          onClick={() => setVoiceType(t.id)} 
                          className={`px-6 py-3 border-4 border-[#4a2e1b] rounded-2xl ${voiceType === t.id ? 'bg-[#c44933] text-white' : 'bg-[#e2d5c4]'}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">목소리 높낮이 (Pitch): <span className="font-bold text-[#c44933]">{voicePitch.toFixed(1)}</span></span>
                    <input 
                      type="range" min="-20" max="20" step="1" 
                      value={voicePitch} 
                      onChange={(e) => setVoicePitch(Number(e.target.value))} 
                      className="w-full h-4 rounded-full appearance-none outline-none bg-[#e2d5c4]" 
                    />
                    <div className="flex justify-between text-sm text-gray-500 font-bold px-2">
                      <span>-20 (아주 낮음)</span>
                      <span>0 (기본)</span>
                      <span>+20 (아주 높음)</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <span className="tracking-wide">말하기 속도 (Speed): <span className="font-bold text-[#c44933]">{voiceRate.toFixed(1)}x</span></span>
                    <input 
                      type="range" min="0.5" max="2" step="0.1" 
                      value={voiceRate} 
                      onChange={(e) => setVoiceRate(Number(e.target.value))} 
                      className="w-full h-4 rounded-full appearance-none outline-none bg-[#e2d5c4]" 
                    />
                    <div className="flex justify-between text-sm text-gray-500 font-bold px-2">
                      <span>느리게</span>
                      <span>보통</span>
                      <span>빠르게</span>
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      if (isPlayingVoice) return;
                      setIsPlayingVoice(true);
                      try {
                        const res = await fetch('/api/tts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            text: `안녕? 난 ${name || '네 펫'}이야! 반가워!`,
                            voiceConfig: { name: voiceType, pitch: voicePitch, speakingRate: voiceRate }
                          })
                        });
                        const data = await res.json();
                        if (data.audioContent) {
                          const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
                          audio.onended = () => setIsPlayingVoice(false);
                          audio.play();
                        } else {
                          setIsPlayingVoice(false);
                          alert('미리듣기에 실패했습니다. API 설정을 확인해주세요.');
                        }
                      } catch (err) {
                        setIsPlayingVoice(false);
                        console.error(err);
                      }
                    }}
                    className="mt-4 px-8 py-4 bg-[#4a2e1b] text-white font-black rounded-2xl shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    {isPlayingVoice ? '🎵 재생 중...' : '🔊 목소리 미리듣기'}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const config = {
                  ...currentConfig,
                  id: Date.now(),
                  name: name || '이름 없는 펫'
                };
                // Get existing cart or empty array
                const existingCart = JSON.parse(localStorage.getItem('petLink_cart') || '[]');
                existingCart.push(config);
                localStorage.setItem('petLink_cart', JSON.stringify(existingCart));

                // Also save as the active preview pet
                localStorage.setItem('petLink_customPet', JSON.stringify(config));

                window.location.href = '/cart';
              }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-12 py-5 bg-[#d8e2b8] hover:bg-[#c5d19d] border-[#4a2e1b] border-[6px] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all group cursor-pointer z-20 w-max"
            >
              <span className="text-[#4a2e1b] font-black text-2xl tracking-wide flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                장바구니에 담기
              </span>
            </button>
          </div>
        </div>
      </div>

      {isPreviewing && (
        <div className="fixed bottom-10 right-10 z-[100] w-64 h-64 pointer-events-auto">
          <CustomPet previewConfig={currentConfig} />
        </div>
      )}
    </div>
  );
}
