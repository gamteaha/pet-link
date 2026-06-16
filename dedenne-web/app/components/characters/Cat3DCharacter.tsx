'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Cat3DViewer = dynamic(
  () => import('./Cat3DViewer'),
  { ssr: false }
);

export default function Cat3DCharacter({
  furColor = '#A89BC0',
  isEating = false,
  isMoving = false,
  trackMouse = true,
  characterSize = 100,
  direction = 1
}: {
  furColor?: string;
  isEating?: boolean;
  isMoving?: boolean;
  trackMouse?: boolean;
  characterSize?: number;
  direction?: number;
}) {
  const [currentAnim, setCurrentAnim] = useState<string>('Idle');

  // 상위 상태(isEating, isMoving)에 따른 애니메이션 변경
  useEffect(() => {
    if (isEating) {
      setCurrentAnim('Idle_Eating');
    } else if (isMoving) {
      setCurrentAnim('Walk');
    } else {
      setCurrentAnim('Idle');
    }
  }, [isEating, isMoving]);

  // 고양이 클릭 시 상호작용
  const handleClick = () => {
    if (isEating || isMoving) return;
    setCurrentAnim('Headbutt');
    setTimeout(() => setCurrentAnim('Idle'), 1000);
  };

  return (
    <div className="w-full h-full cursor-pointer" onClick={handleClick}>
      <Cat3DViewer 
        animationName={currentAnim} 
        furColor={furColor} 
        trackMouse={trackMouse}
        characterSize={characterSize}
        direction={direction}
      />
    </div>
  );
}
