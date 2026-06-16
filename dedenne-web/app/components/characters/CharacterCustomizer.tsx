"use client";

import React, { useState } from 'react';
import CatCharacter from './CatCharacter';
import DogCharacter from './DogCharacter';

const FUR_PALETTES = [
  { name: '라벤더', furColor: '#A89BC0', furDark: '#8B7DAE', furLight: '#C8BDD8' },
  { name: '오렌지', furColor: '#E8956D', furDark: '#D07B55', furLight: '#F0B095' },
  { name: '흰색', furColor: '#F5F5F5', furDark: '#D0D0D0', furLight: '#FFFFFF' },
  { name: '검정', furColor: '#3D3D3D', furDark: '#202020', furLight: '#5A5A5A' },
  { name: '갈색', furColor: '#C8A882', furDark: '#A07850', furLight: '#E8D5B8' },
  { name: '회색', furColor: '#9B9B9B', furDark: '#7A7A7A', furLight: '#B8B8B8' },
];

const ACC_COLORS = ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#9D4EDD', '#2C2C2C'];

type Species = 'cat' | 'dog';
type EyeShape = 'round' | 'sleepy' | 'wide';
type Accessory = 'none' | 'ribbon' | 'hat' | 'necklace' | 'glasses';

export default function CharacterCustomizer() {
  const [species, setSpecies] = useState<Species>('cat');
  const [furIdx, setFurIdx] = useState(0);
  const [eyeShape, setEyeShape] = useState<EyeShape>('round');
  const [accessory, setAccessory] = useState<Accessory>('none');
  const [accColorIdx, setAccColorIdx] = useState(0);

  const selectedFur = FUR_PALETTES[furIdx];
  const selectedAccColor = ACC_COLORS[accColorIdx];

  const characterProps = {
    furColor: selectedFur.furColor,
    furDark: selectedFur.furDark,
    furLight: selectedFur.furLight,
    eyeShape: eyeShape,
    accessory: accessory,
    accessoryColor: selectedAccColor,
  };

  const handleSave = () => {
    // Save to localStorage or similar logic depending on the app's need
    const petConfig = { species, ...characterProps };
    localStorage.setItem('petLink_draftSVGPet', JSON.stringify(petConfig));
    alert('저장되었습니다! 🐾');
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 bg-white p-6 md:p-10 rounded-3xl shadow-xl border-4 border-[#e8dac1]">
      {/* 뷰어 영역 */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center bg-[#fef8ed] p-8 rounded-2xl border-2 border-[#e8dac1]">
        <div className="flex gap-4 mb-6 bg-white p-2 rounded-full shadow-sm border border-[#e8dac1]">
          <button
            onClick={() => setSpecies('cat')}
            className={`px-6 py-2 rounded-full font-bold transition-colors ${species === 'cat' ? 'bg-[#e07a5f] text-white' : 'text-[#a68a7e] hover:bg-[#fdf6e3]'}`}
          >
            🐱 고양이
          </button>
          <button
            onClick={() => setSpecies('dog')}
            className={`px-6 py-2 rounded-full font-bold transition-colors ${species === 'dog' ? 'bg-[#e07a5f] text-white' : 'text-[#a68a7e] hover:bg-[#fdf6e3]'}`}
          >
            🐶 강아지
          </button>
        </div>

        <div className="w-64 h-64 md:w-80 md:h-80 relative drop-shadow-xl">
          {species === 'cat' ? (
            <CatCharacter {...characterProps} className="w-full h-full" />
          ) : (
            <DogCharacter {...characterProps} className="w-full h-full" />
          )}
        </div>
      </div>

      {/* 컨트롤 영역 */}
      <div className="lg:w-1/2 flex flex-col gap-6">
        <h2 className="text-2xl font-black text-[#4a2e1b]">커스터마이징</h2>
        
        {/* 털 색상 */}
        <div className="space-y-3">
          <label className="font-bold text-[#a68a7e]">털 색상</label>
          <div className="flex flex-wrap gap-3">
            {FUR_PALETTES.map((palette, idx) => (
              <button
                key={palette.name}
                onClick={() => setFurIdx(idx)}
                className={`w-12 h-12 rounded-full border-4 transition-transform hover:scale-110 ${furIdx === idx ? 'border-[#e07a5f] scale-110' : 'border-white shadow-md'}`}
                style={{ backgroundColor: palette.furColor }}
                title={palette.name}
              />
            ))}
          </div>
        </div>

        {/* 눈 모양 */}
        <div className="space-y-3">
          <label className="font-bold text-[#a68a7e]">눈 모양</label>
          <div className="flex gap-3">
            <button onClick={() => setEyeShape('round')} className={`px-4 py-2 rounded-xl font-bold border-2 ${eyeShape === 'round' ? 'border-[#e07a5f] bg-[#fff0f5] text-[#e07a5f]' : 'border-[#e8dac1] text-[#a68a7e] hover:bg-[#fdf6e3]'}`}>😊 둥근 눈</button>
            <button onClick={() => setEyeShape('sleepy')} className={`px-4 py-2 rounded-xl font-bold border-2 ${eyeShape === 'sleepy' ? 'border-[#e07a5f] bg-[#fff0f5] text-[#e07a5f]' : 'border-[#e8dac1] text-[#a68a7e] hover:bg-[#fdf6e3]'}`}>😌 감은 눈</button>
            <button onClick={() => setEyeShape('wide')} className={`px-4 py-2 rounded-xl font-bold border-2 ${eyeShape === 'wide' ? 'border-[#e07a5f] bg-[#fff0f5] text-[#e07a5f]' : 'border-[#e8dac1] text-[#a68a7e] hover:bg-[#fdf6e3]'}`}>👁️ 큰 눈</button>
          </div>
        </div>

        {/* 악세서리 */}
        <div className="space-y-3">
          <label className="font-bold text-[#a68a7e]">악세서리</label>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setAccessory('none')} className={`px-4 py-2 rounded-xl font-bold border-2 ${accessory === 'none' ? 'border-[#e07a5f] bg-[#fff0f5] text-[#e07a5f]' : 'border-[#e8dac1] text-[#a68a7e]'}`}>없음</button>
            <button onClick={() => setAccessory('ribbon')} className={`px-4 py-2 rounded-xl font-bold border-2 ${accessory === 'ribbon' ? 'border-[#e07a5f] bg-[#fff0f5] text-[#e07a5f]' : 'border-[#e8dac1] text-[#a68a7e]'}`}>🎀 리본</button>
            <button onClick={() => setAccessory('hat')} className={`px-4 py-2 rounded-xl font-bold border-2 ${accessory === 'hat' ? 'border-[#e07a5f] bg-[#fff0f5] text-[#e07a5f]' : 'border-[#e8dac1] text-[#a68a7e]'}`}>🎩 모자</button>
            <button onClick={() => setAccessory('necklace')} className={`px-4 py-2 rounded-xl font-bold border-2 ${accessory === 'necklace' ? 'border-[#e07a5f] bg-[#fff0f5] text-[#e07a5f]' : 'border-[#e8dac1] text-[#a68a7e]'}`}>📿 목걸이</button>
            <button onClick={() => setAccessory('glasses')} className={`px-4 py-2 rounded-xl font-bold border-2 ${accessory === 'glasses' ? 'border-[#e07a5f] bg-[#fff0f5] text-[#e07a5f]' : 'border-[#e8dac1] text-[#a68a7e]'}`}>👓 안경</button>
          </div>
        </div>

        {/* 악세서리 색상 */}
        {accessory !== 'none' && (
          <div className="space-y-3 animate-fade-in">
            <label className="font-bold text-[#a68a7e]">악세서리 색상</label>
            <div className="flex gap-3">
              {ACC_COLORS.map((color, idx) => (
                <button
                  key={color}
                  onClick={() => setAccColorIdx(idx)}
                  className={`w-10 h-10 rounded-full border-4 transition-transform hover:scale-110 ${accColorIdx === idx ? 'border-[#e07a5f] scale-110' : 'border-white shadow-md'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-6">
          <button 
            onClick={handleSave}
            className="w-full py-4 bg-[#e07a5f] hover:bg-[#d56b50] text-white font-black text-lg rounded-2xl shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
