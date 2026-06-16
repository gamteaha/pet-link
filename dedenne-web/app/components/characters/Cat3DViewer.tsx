'use client';
import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useMemo } from 'react';

// 고양이 모델 + 애니메이션
function CatModel({
  animationName = 'Idle',
  furColor = '#A89BC0',
  trackMouse = true,
  characterSize = 100,
  direction = 1
}: {
  animationName?: string;
  furColor?: string;
  trackMouse?: boolean;
  characterSize?: number;
  direction?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/cat.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, group);

  const targetRotationY = useRef(0);

  // 마우스 위치 추적
  useEffect(() => {
    if (!trackMouse) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse x between -1 and 1
      targetRotationY.current = (e.clientX / window.innerWidth) * 2 - 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [trackMouse]);

  // 애니메이션 전환
  useEffect(() => {
    const action = actions[animationName];
    if (action) {
      action.reset().fadeIn(0.3).play();
      return () => { action.fadeOut(0.3); };
    }
  }, [animationName, actions]);

  // 털 색상 커스텀
  useEffect(() => {
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => {
            (mat as THREE.MeshStandardMaterial).color.set(furColor);
          });
        } else {
          (mesh.material as THREE.MeshStandardMaterial).color.set(furColor);
        }
      }
    });
  }, [furColor, clone]);

  // 시선 추적 (Head 노드 회전) 및 방향 전환
  useFrame(() => {
    if (!group.current) return;

    // 이동 방향에 따라 모델 회전 (Walk/Run 중일 때)
    const isMoving = animationName === 'Walk' || animationName === 'Run';
    if (isMoving) {
      // 오른쪽(direction=1) -> 0, 왼쪽(direction=-1) -> Math.PI
      const targetY = direction === 1 ? Math.PI : 0;
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetY,
        0.1
      );
    } else {
      // 멈춰있을 땐 기본 방향(정면: Math.PI / 2)으로 복귀
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.PI / 2, 0.1);
    }

    if (!trackMouse) return;
    
    const head = group.current.getObjectByName('Head');
    if (!head) return;

    // 마우스 위치 기반 고개 회전 (-0.5 ~ 0.5 라디안)
    // 이동 중일 땐 시선 추적 최소화
    if (!isMoving) {
      head.rotation.y = THREE.MathUtils.lerp(
        head.rotation.y,
        targetRotationY.current * 0.5,
        0.1
      );
    }
  });

  const baseScale = 0.8; // 기본 크기 조정 (기존 1.5는 너무 컸음)
  const dynamicScale = baseScale * (characterSize / 100);

  return <primitive ref={group} object={clone} scale={dynamicScale} position={[0, -0.5, 0]} />;
}

// 뷰어 컨테이너
export default function Cat3DViewer({
  animationName = 'Idle',
  furColor = '#A89BC0',
  trackMouse = true,
  characterSize = 100,
  direction = 1,
}: {
  animationName?: string;
  furColor?: string;
  trackMouse?: boolean;
  characterSize?: number;
  direction?: number;
}) {
  return (
    <div className="w-full h-full relative" style={{ minHeight: '350px' }}>
      <Canvas
        camera={{ position: [0, 1, 3], fov: 45 }}
        style={{ background: 'transparent', position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 2]} intensity={1.2} />
        <CatModel animationName={animationName} furColor={furColor} trackMouse={trackMouse} characterSize={characterSize} direction={direction} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/cat.glb');
