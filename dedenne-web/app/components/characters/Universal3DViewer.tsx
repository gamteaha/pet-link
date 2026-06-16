'use client';
import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const MODEL_MAP: Record<string, string> = {
  cat:     '/models/cat.glb',
  dog:     '/models/dog.glb',
  raccoon: '/models/raccoon.glb',
  pig:     '/models/pig.glb',
  chick:   '/models/chick.glb',
  chicken: '/models/chicken.glb',
  horse:   '/models/horse.glb',
  'blue-tang': '/models/blue-tang.glb',
};

const ANIM_MAP: Record<string, Record<string, string>> = {
  // 그룹 A (표준 4족)
  default: {
    idle:    'Idle',
    walk:    'Walk',
    run:     'Run',
    eat:     'Idle_Eating',
    click:   'Headbutt',
    jump:    'Jump_Start',
  },
  // 그룹 B (조류)
  chick: {
    idle:    'Idle',
    walk:    'Run',       // Walk 없음
    run:     'Run',
    eat:     'Idle_Peck', // Idle_Eating 없음
    click:   'Attack',    // Headbutt 없음
    jump:    'Run',
  },
  chicken: {
    idle:    'Idle',
    walk:    'Run',
    run:     'Run',
    eat:     'Idle_Peck',
    click:   'Attack',
    jump:    'Run',
  },
  // 그룹 C (물고기)
  'blue-tang': {
    idle:    'Fish_Armature|Fish_Armature|Swimming_Normal',
    walk:    'Fish_Armature|Fish_Armature|Swimming_Fast',
    run:     'Fish_Armature|Fish_Armature|Swimming_Fast',
    eat:     'Fish_Armature|Fish_Armature|Swimming_Normal',
    click:   'Fish_Armature|Fish_Armature|Attack',
    jump:    'Fish_Armature|Fish_Armature|Swimming_Impulse',
  },
};

const NO_HEAD_TRACKING = ['chick', 'chicken', 'blue-tang'];

function UniversalModel({
  species,
  animationState = 'idle',
  furColor,
  trackMouse = true,
  characterSize = 100,
  direction = 1
}: {
  species: string;
  animationState?: string;
  furColor?: string;
  trackMouse?: boolean;
  characterSize?: number;
  direction?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const gltfPath = MODEL_MAP[species] || MODEL_MAP['cat'];
  const { scene, animations } = useGLTF(gltfPath);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene, gltfPath]);
  const { actions } = useAnimations(animations, group);

  const targetRotationY = useRef(0);
  const animConfig = ANIM_MAP[species] || ANIM_MAP['default'];
  const actualAnimationName = animConfig[animationState] || animConfig['idle'];

  // 마우스 위치 추적
  useEffect(() => {
    if (!trackMouse) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      targetRotationY.current = (e.clientX / window.innerWidth) * 2 - 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [trackMouse]);

  // 애니메이션 전환
  useEffect(() => {
    const action = actions[actualAnimationName];
    if (action) {
      action.reset().fadeIn(0.3).play();
      return () => { action.fadeOut(0.3); };
    }
  }, [actualAnimationName, actions]);

  // 털 색상 커스텀
  useEffect(() => {
    if (furColor && (species === 'cat' || species === 'dog')) {
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => {
              if ((mat as THREE.MeshStandardMaterial).color) {
                (mat as THREE.MeshStandardMaterial).color.set(furColor);
              }
            });
          } else {
            if ((mesh.material as THREE.MeshStandardMaterial).color) {
              (mesh.material as THREE.MeshStandardMaterial).color.set(furColor);
            }
          }
        }
      });
    }
  }, [furColor, clone, species]);

  // 시선 추적 및 방향 전환
  useFrame(() => {
    if (!group.current) return;

    const isMoving = animationState === 'walk' || animationState === 'run';
    
    if (species !== 'blue-tang') {
      if (isMoving) {
        const targetY = direction === 1 ? Math.PI : 0;
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.1);
      } else {
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.PI / 2, 0.1);
      }
    }

    if (!trackMouse || NO_HEAD_TRACKING.includes(species)) return;
    
    const head = group.current.getObjectByName('Head');
    if (!head) return;

    if (!isMoving) {
      head.rotation.y = THREE.MathUtils.lerp(
        head.rotation.y,
        targetRotationY.current * 0.5,
        0.1
      );
    }
  });

  let baseScale = 0.8;
  if (species === 'horse') baseScale = 0.45;
  if (species === 'blue-tang') baseScale = 0.35;
  if (species === 'pig') baseScale = 0.6; // maybe slightly smaller too
  const dynamicScale = baseScale * (characterSize / 100);

  return <primitive ref={group} object={clone} scale={dynamicScale} position={[0, -0.5, 0]} />;
}

export default function Universal3DViewer({
  species,
  animationState = 'idle',
  furColor,
  trackMouse = true,
  characterSize = 100,
  direction = 1,
  containerClassName,
}: {
  species: string;
  animationState?: string;
  furColor?: string;
  trackMouse?: boolean;
  characterSize?: number;
  direction?: number;
  containerClassName?: string;
}) {
  return (
    <div className={`w-full h-full relative ${containerClassName || ''}`} style={containerClassName ? {} : { minHeight: '350px' }}>
      <Canvas
        camera={{ position: [0, 1, 3], fov: 45 }}
        style={{ background: 'transparent', position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 2]} intensity={1.2} />
        <UniversalModel 
          species={species} 
          animationState={animationState} 
          furColor={furColor} 
          trackMouse={trackMouse} 
          characterSize={characterSize} 
          direction={direction} 
        />
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

// Preload all models
if (typeof window !== 'undefined') {
  Object.values(MODEL_MAP).forEach(path => {
    useGLTF.preload(path);
  });
}
