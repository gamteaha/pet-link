"use client";

import React, { useState } from 'react';
import { DownloadCloud, PlayCircle, MousePointerClick, HeartHandshake, ChevronRight, ChevronLeft, X, Terminal } from 'lucide-react';

interface ManualModalProps {
  onClose: () => void;
  isDedenne?: boolean;
}

const steps = [
  {
    icon: <DownloadCloud className="w-16 h-16 text-[#81b29a]" />,
    title: "1. 필수 프로그램(Node.js) 설치",
    desc: "PC 플레이어는 웹 기술로 만들어져 있습니다! 만약 컴퓨터에 Node.js가 없다면 구동되지 않으니, nodejs.org에서 LTS 버전을 먼저 설치해주세요."
  },
  {
    icon: <DownloadCloud className="w-16 h-16 text-[#e07a5f]" />,
    title: "2. PC 펫 플레이어 다운로드 및 압축 해제",
    desc: "나의 펫 목록에서 [PC 펫 플레이어 다운로드] 버튼을 눌러 ZIP 파일을 다운로드하고, 원하는 폴더에 압축을 풀어주세요."
  },
  {
    icon: <PlayCircle className="w-16 h-16 text-[#f2cc8f]" />,
    title: "3. 실행 파일(run_pet.bat) 더블클릭",
    desc: "압축을 푼 폴더 안에 있는 'run_pet.bat' 파일을 더블클릭합니다. 처음 실행 시에는 펫을 띄우기 위한 1~2분 정도의 설치 과정이 자동으로 진행됩니다."
  },
  {
    icon: <Terminal className="w-16 h-16 text-[#81b29a]" />,
    title: "4. 명령프롬프트가 꺼지지 않는다면?",
    desc: "만일 명령프롬프트가 꺼지지 않는다면 걱정마세요. 명령프롬프트를 중지하고 'launch.vbs'를 작동시키면 됩니다."
  },
  {
    icon: <MousePointerClick className="w-16 h-16 text-[#f2cc8f]" />,
    title: "5. 펫 우클릭으로 메뉴 열기",
    desc: "바탕화면에 귀여운 펫이 나타났나요? 펫을 마우스 '우클릭'하면 내 가방 열기, 쓰다듬기 등 다양한 상호작용 메뉴가 나타납니다."
  },
  {
    icon: <HeartHandshake className="w-16 h-16 text-[#e07a5f]" />,
    title: "6. 가방에서 아이템 꺼내 쓰기",
    desc: "메뉴에서 '내 가방'을 열어 펫에게 밥을 주거나 씻겨주세요! 캐릭터 가방에 담긴 아이템은 모든 펫이 함께 공유해서 사용할 수 있습니다."
  }
];

const dedenneSteps = [
  {
    icon: <DownloadCloud className="w-16 h-16 text-[#e07a5f]" />,
    title: "1. 데덴네 플레이어 다운로드 및 압축 해제",
    desc: "나의 펫 목록에서 [PC 펫 플레이어 다운로드] 버튼을 눌러 ZIP 파일을 다운로드하고, 원하는 폴더에 압축을 풀어주세요."
  },
  {
    icon: <PlayCircle className="w-16 h-16 text-[#f2cc8f]" />,
    title: "2. 실행 파일(데덴네 실행.bat) 더블클릭",
    desc: "압축을 푼 폴더 안에 있는 '데덴네 실행.bat' 파일을 더블클릭합니다. 최초 실행 시 파이썬 가상환경과 라이브러리를 설치하느라 1~2분 정도 소요됩니다."
  },
  {
    icon: <Terminal className="w-16 h-16 text-[#81b29a]" />,
    title: "3. 설치가 완료될 때까지 대기",
    desc: "까만 실행창(명령프롬프트)이 뜨고 'Running dependency check...' 문구가 나온다면 정상입니다. 설치가 끝날 때까지 창을 끄지 말고 잠시만 기다려주세요!"
  },
  {
    icon: <MousePointerClick className="w-16 h-16 text-[#f2cc8f]" />,
    title: "4. 데덴네와 상호작용하기",
    desc: "설치가 완료되면 바탕화면에 데덴네가 뿅 하고 나타납니다. 마우스 왼쪽 버튼으로 드래그할 수 있고, 우클릭을 하면 메뉴가 열립니다."
  },
  {
    icon: <HeartHandshake className="w-16 h-16 text-[#e07a5f]" />,
    title: "5. 공용 가방 아이템 공유",
    desc: "우클릭 메뉴에서 '가방'을 열어 간식을 주거나 씻겨주세요! 상점에서 구매한 공용 가방 아이템 수량과 완벽히 연동됩니다."
  }
];

export default function ManualModal({ onClose, isDedenne }: ManualModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const activeSteps = isDedenne ? dedenneSteps : steps;

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, activeSteps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed Background */}
      <div 
        className="absolute inset-0 bg-[#3d2314]/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#fdf6e3] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-[#e8dac1] animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-[#e07a5f] p-6 text-white text-center relative">
          <h2 className="text-2xl font-black tracking-wide">💡 PC 펫 설치 및 사용 가이드</h2>
          <button 
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Carousel Content */}
        <div className="p-10 flex flex-col items-center text-center min-h-[320px] justify-center">
          <div className="bg-white w-32 h-32 rounded-full shadow-md flex items-center justify-center mb-8 transform transition-transform hover:scale-110 duration-300">
            {activeSteps[currentStep].icon}
          </div>
          <h3 className="text-2xl font-bold text-[#4a2e1b] mb-4">{activeSteps[currentStep].title}</h3>
          <p className="text-lg text-[#8c4a23] leading-relaxed max-w-lg">
            {activeSteps[currentStep].desc}
          </p>
        </div>

        {/* Navigation */}
        <div className="bg-white/50 p-6 flex items-center justify-between border-t border-[#e8dac1]">
          <button 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#e07a5f] bg-white border-2 border-[#e07a5f] hover:bg-[#fff0f5] disabled:opacity-30 disabled:hover:bg-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            이전
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {activeSteps.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  currentStep === idx ? 'bg-[#c44933] w-8' : 'bg-[#e8dac1]'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={currentStep === activeSteps.length - 1 ? onClose : nextStep}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-[#e07a5f] hover:bg-[#c44933] transition-all shadow-md hover:shadow-lg"
          >
            {currentStep === activeSteps.length - 1 ? '시작하기' : '다음'}
            {currentStep !== activeSteps.length - 1 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

      </div>
    </div>
  );
}
