'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Universal3DViewer = dynamic(
  () => import('./Universal3DViewer'),
  { ssr: false }
);

export default function Animal3DCharacter({
  species,
  furColor,
  isEating = false,
  isMoving = false,
  trackMouse = true,
  characterSize = 100,
  direction = 1
}: {
  species: string;
  furColor?: string;
  isEating?: boolean;
  isMoving?: boolean;
  trackMouse?: boolean;
  characterSize?: number;
  direction?: number;
}) {
  const [currentAnim, setCurrentAnim] = useState<string>('idle');

  // 상위 상태(isEating, isMoving)에 따른 추상화된 애니메이션 상태(state) 변경
  useEffect(() => {
    if (isEating) {
      setCurrentAnim('eat');
    } else if (isMoving) {
      setCurrentAnim('walk');
    } else {
      setCurrentAnim('idle');
    }
  }, [isEating, isMoving]);

  // 클릭 시 상호작용
  const handleClick = () => {
    if (isEating || isMoving) return;
    setCurrentAnim('click');
    setTimeout(() => setCurrentAnim('idle'), 1000);
  };

  return (
    <div className="w-full h-full cursor-pointer" onClick={handleClick}>
      <Universal3DViewer 
        species={species}
        animationState={currentAnim} 
        furColor={furColor} 
        trackMouse={trackMouse}
        characterSize={characterSize}
        direction={direction}
      />
    </div>
  );
}
