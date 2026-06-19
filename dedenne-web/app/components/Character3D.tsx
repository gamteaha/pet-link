"use client";

import React, { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, RoundedBox, Sphere, Cylinder, Torus, Cone } from "@react-three/drei";
import * as THREE from "three";

export interface Character3DProps {
  hairColorHSL: string;
  skinColorHex: string;
  outfitColorHex: string;
  backpackColorHex: string;
  frontHairIndex: number;
  backHairIndex: number;
  bodyType: number;
  eyeType: number;
  mouthType: number;
  blushType: number;
  outfitStyle: number;
  hatType: number;
  characterSize?: number;
  glassesType?: number;
  glassesColorHex?: string;
  backpackType?: number;
  isWalking?: boolean;
  isDragging?: boolean;
  isEating?: boolean;
  isWashing?: boolean;
  direction?: number;
  hideControls?: boolean;
}

function CharacterModel({
  hairColorHSL,
  skinColorHex,
  outfitColorHex,
  backpackColorHex,
  frontHairIndex,
  backHairIndex,
  bodyType,
  eyeType,
  mouthType,
  blushType,
  outfitStyle,
  hatType,
  characterSize = 100,
  glassesType = 1,
  glassesColorHex = "#1a1a1a",
  backpackType = 2,
  isWalking = false,
  isDragging = false,
  isEating = false,
  isWashing = false,
  direction = 1
}: Character3DProps) {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const { gl } = useThree();

  // Global mouse tracking for head rotation
  const globalMouse = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Find the specific canvas for this instance
      const canvas = gl.domElement;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Scale down by a factor (e.g., 300 pixels = max turn)
      const maxTurn = 300;
      globalMouse.current.x = Math.max(-1, Math.min(1, dx / maxTurn));
      globalMouse.current.y = Math.max(-1, Math.min(1, dy / maxTurn));
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gl]);

  // Animation Loop
  useFrame((state, delta) => {
    if (!group.current) return;

    if (isDragging) {
      // Rapid flailing wiggle and wobble
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 25) * 0.15;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 30) * 0.05;

      const flail = Math.sin(state.clock.elapsedTime * 25) * 0.8;
      if (leftArm.current) {
        leftArm.current.rotation.x = flail;
        leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, -0.6 + Math.cos(state.clock.elapsedTime * 25) * 0.3, 15 * delta);
      }
      if (rightArm.current) {
        rightArm.current.rotation.x = -flail;
        rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, 0.6 - Math.cos(state.clock.elapsedTime * 25) * 0.3, 15 * delta);
      }
      
      const legFlail = Math.sin(state.clock.elapsedTime * 20) * 0.5;
      if (leftLeg.current) leftLeg.current.rotation.x = legFlail;
      if (rightLeg.current) rightLeg.current.rotation.x = -legFlail;

      if (headRef.current) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 10 * delta);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 10 * delta);
      }
    } else if (isEating) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 20) * 0.03;
      group.current.rotation.z = 0;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 10 * delta);
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 15) * 0.1;
      
      if (leftArm.current) {
        leftArm.current.rotation.x = -Math.PI / 2 + Math.sin(state.clock.elapsedTime * 20) * 0.1;
        leftArm.current.rotation.z = -0.1;
      }
      if (rightArm.current) {
        rightArm.current.rotation.x = -Math.PI / 2 + Math.cos(state.clock.elapsedTime * 20) * 0.1;
        rightArm.current.rotation.z = 0.1;
      }
      if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, 10 * delta);
      if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, 10 * delta);

      if (headRef.current) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 10 * delta);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 10 * delta);
      }
    } else if (isWashing) {
      group.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.05;
      group.current.rotation.z = 0;
      group.current.rotation.x = 0;
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 15) * 0.3;
      
      if (leftArm.current) {
        leftArm.current.rotation.x = -Math.PI / 4 + Math.sin(state.clock.elapsedTime * 25) * 0.2;
        leftArm.current.rotation.z = -0.2 + Math.sin(state.clock.elapsedTime * 20) * 0.2;
      }
      if (rightArm.current) {
        rightArm.current.rotation.x = -Math.PI / 4 - Math.sin(state.clock.elapsedTime * 25) * 0.2;
        rightArm.current.rotation.z = 0.2 - Math.sin(state.clock.elapsedTime * 20) * 0.2;
      }
      if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, 10 * delta);
      if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, 10 * delta);

      if (headRef.current) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 10 * delta);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 10 * delta);
      }
    } else if (isWalking) {
      // Walking bounce
      group.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 12)) * 0.08;
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 10 * delta);

      // Rotate body to face walking direction (1 = right, -1 = left)
      const targetRotation = direction === 1 ? Math.PI / 2 : -Math.PI / 2;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotation, 10 * delta);

      const targetSpread = backpackType === 3 ? 0.5 : 0; // Arm spread angle

      // Swing Limbs
      const swing = Math.sin(state.clock.elapsedTime * 12) * 0.6;
      if (leftArm.current) {
        leftArm.current.rotation.x = swing;
        leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, -targetSpread, 10 * delta);
      }
      if (rightArm.current) {
        rightArm.current.rotation.x = -swing;
        rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, targetSpread, 10 * delta);
      }
      if (leftLeg.current) leftLeg.current.rotation.x = -swing;
      if (rightLeg.current) rightLeg.current.rotation.x = swing;

      if (headRef.current) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 10 * delta);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 10 * delta);
      }
    } else {
      // Idle floating
      group.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 10 * delta);

      // Face front
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 10 * delta);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 10 * delta);

      const targetSpread = backpackType === 3 ? 0.5 : 0;

      // Reset limbs
      if (leftArm.current) {
        leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0, 10 * delta);
        leftArm.current.rotation.z = THREE.MathUtils.lerp(leftArm.current.rotation.z, -targetSpread, 10 * delta);
      }
      if (rightArm.current) {
        rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0, 10 * delta);
        rightArm.current.rotation.z = THREE.MathUtils.lerp(rightArm.current.rotation.z, targetSpread, 10 * delta);
      }
      if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, 10 * delta);
      if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, 10 * delta);

      // Mouse tracking for head
      if (headRef.current) {
        // Fix inversion: positive globalMouse.x (mouse to the right) -> positive rotation.y
        // Positive globalMouse.y (mouse below) -> positive rotation.x (look down)
        const targetHeadY = globalMouse.current.x * 0.8; 
        const targetHeadX = globalMouse.current.y * 0.4;

        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetHeadY, 5 * delta);
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetHeadX, 5 * delta);
      }
    }
  });

  const skinMaterial = new THREE.MeshToonMaterial({ color: skinColorHex });
  const hairMaterial = new THREE.MeshToonMaterial({ color: hairColorHSL });
  const outfitMaterial = new THREE.MeshToonMaterial({ color: outfitColorHex });
  const backpackMaterial = new THREE.MeshToonMaterial({ color: backpackColorHex });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: "#222" });
  const mouthMaterial = new THREE.MeshBasicMaterial({ color: "#4a2e1b" });
  const blushMaterial = new THREE.MeshBasicMaterial({ color: "#ff9999", transparent: true, opacity: 0.6 });

  // Body Scaling & Positioning
  let bodyScale: [number, number, number] = [1, 1, 1];
  let headY = 1.3;
  let legY = -0.5;

  if (bodyType === 2) { // Tall
    bodyScale = [0.9, 1.2, 0.9];
    headY = 1.5;
    legY = -0.6;
  } else if (bodyType === 3) { // Chubby
    bodyScale = [1.2, 0.9, 1.1];
    headY = 1.15;
    legY = -0.45;
  }

  const headRadius = 0.65;
  const faceZ = headRadius + 0.02;

  return (
    <group ref={group} position={[0, 0.1, 0]}>
      {/* Head Group */}
      <group ref={headRef} position={[0, headY, 0]}>
        {/* Base Head */}
        <Sphere args={[headRadius, 32, 32]} material={skinMaterial} />

        {/* Eyes */}
        <group position={[0, 0, faceZ]}>
          {eyeType === 1 && (
            <>
              <Sphere args={[0.07, 16, 16]} position={[-0.22, 0, 0]} material={eyeMaterial} />
              <Sphere args={[0.07, 16, 16]} position={[0.22, 0, 0]} material={eyeMaterial} />
            </>
          )}
          {eyeType === 2 && ( // Happy ^ ^ eyes
            <>
              <Torus args={[0.07, 0.02, 8, 16, Math.PI]} position={[-0.22, -0.05, 0]} rotation={[0, 0, 0]} material={eyeMaterial} />
              <Torus args={[0.07, 0.02, 8, 16, Math.PI]} position={[0.22, -0.05, 0]} rotation={[0, 0, 0]} material={eyeMaterial} />
            </>
          )}
          {eyeType === 3 && ( // Closed - - eyes
            <>
              <Cylinder args={[0.02, 0.02, 0.12, 8]} position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={eyeMaterial} />
              <Cylinder args={[0.02, 0.02, 0.12, 8]} position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={eyeMaterial} />
            </>
          )}
          {eyeType === 4 && ( // Wide dots
            <>
              <Sphere args={[0.1, 16, 16]} position={[-0.26, 0, 0]} material={eyeMaterial} />
              <Sphere args={[0.1, 16, 16]} position={[0.26, 0, 0]} material={eyeMaterial} />
            </>
          )}
        </group>

        {/* Mouth */}
        <group position={[0, -0.15, faceZ + 0.02]}>
          {mouthType === 1 && null}
          {mouthType === 2 && ( // Smile
            <Torus args={[0.05, 0.015, 8, 16, Math.PI]} position={[0, 0.04, 0]} rotation={[Math.PI, 0, 0]} material={mouthMaterial} />
          )}
          {mouthType === 3 && ( // Straight
            <Cylinder args={[0.015, 0.015, 0.08, 8]} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mouthMaterial} />
          )}
          {mouthType === 4 && ( // Open
            <Sphere args={[0.04, 16, 16]} position={[0, 0, 0]} material={mouthMaterial} />
          )}
        </group>

        {/* Glasses */}
        {glassesType === 2 && ( // Round
          <group position={[0, 0.03, faceZ]}>
            <Torus args={[0.15, 0.02, 16, 32]} position={[-0.25, 0, 0]} rotation={[0, 0, 0]}>
              <meshStandardMaterial color={glassesColorHex} roughness={0.4} metalness={0.8} />
            </Torus>
            <Torus args={[0.15, 0.02, 16, 32]} position={[0.25, 0, 0]} rotation={[0, 0, 0]}>
              <meshStandardMaterial color={glassesColorHex} roughness={0.4} metalness={0.8} />
            </Torus>
            {/* Bridge */}
            <Cylinder args={[0.015, 0.015, 0.2]} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color={glassesColorHex} roughness={0.4} metalness={0.8} />
            </Cylinder>
          </group>
        )}
        {glassesType === 3 && ( // Square
          <group position={[0, 0.02, faceZ]}>
            <group position={[-0.21, 0, 0]}>
              <Torus args={[0.16, 0.025, 4, 4]} rotation={[0, 0, Math.PI / 4]}>
                <meshStandardMaterial color={glassesColorHex} roughness={0.4} metalness={0.8} />
              </Torus>
            </group>
            <group position={[0.21, 0, 0]}>
              <Torus args={[0.16, 0.025, 4, 4]} rotation={[0, 0, Math.PI / 4]}>
                <meshStandardMaterial color={glassesColorHex} roughness={0.4} metalness={0.8} />
              </Torus>
            </group>
            {/* Bridge */}
            <Cylinder args={[0.015, 0.015, 0.15]} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color={glassesColorHex} roughness={0.4} metalness={0.8} />
            </Cylinder>
          </group>
        )}
        {glassesType === 4 && ( // Rectangular
          <group position={[0, 0.02, faceZ]}>
            <group position={[-0.24, 0, 0]} scale={[1.4, 0.8, 1]}>
              <Torus args={[0.13, 0.025, 4, 4]} rotation={[0, 0, Math.PI / 4]}>
                <meshStandardMaterial color={glassesColorHex} roughness={0.4} metalness={0.8} />
              </Torus>
            </group>
            <group position={[0.24, 0, 0]} scale={[1.4, 0.8, 1]}>
              <Torus args={[0.13, 0.025, 4, 4]} rotation={[0, 0, Math.PI / 4]}>
                <meshStandardMaterial color={glassesColorHex} roughness={0.4} metalness={0.8} />
              </Torus>
            </group>
            {/* Bridge */}
            <Cylinder args={[0.015, 0.015, 0.15]} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color={glassesColorHex} roughness={0.4} metalness={0.8} />
            </Cylinder>
          </group>
        )}

        {/* Blush */}
        {blushType === 2 && ( // Round
          <>
            <Sphere args={[0.1, 16, 16]} position={[-0.35, -0.1, faceZ - 0.02]} scale={[1, 0.5, 0.1]} material={blushMaterial} />
            <Sphere args={[0.1, 16, 16]} position={[0.35, -0.1, faceZ - 0.02]} scale={[1, 0.5, 0.1]} material={blushMaterial} />
          </>
        )}
        {blushType === 3 && ( // Lines ///
          <>
            {[-0.4, -0.35, -0.3].map((x, i) => (
              <Cylinder key={`blush-l-${i}`} args={[0.008, 0.008, 0.06, 8]} position={[x, -0.1, faceZ - 0.02]} rotation={[0, 0, -0.3]} material={new THREE.MeshBasicMaterial({ color: "#ff6666" })} />
            ))}
            {[0.3, 0.35, 0.4].map((x, i) => (
              <Cylinder key={`blush-r-${i}`} args={[0.008, 0.008, 0.06, 8]} position={[x, -0.1, faceZ - 0.02]} rotation={[0, 0, -0.3]} material={new THREE.MeshBasicMaterial({ color: "#ff6666" })} />
            ))}
          </>
        )}

        {/* Hair */}
        <group position={[0, 0, 0]}>
          {/* Base Head Hair Covering */}
          <Sphere args={[0.67, 32, 32]} position={[0, 0.08, -0.1]} material={hairMaterial} />

          {/* Back Hair */}
          {backHairIndex === 2 && ( // Pigtails
            <>
              <Sphere args={[0.25, 16, 16]} position={[-0.7, -0.1, -0.1]} material={hairMaterial} />
              <Sphere args={[0.25, 16, 16]} position={[0.7, -0.1, -0.1]} material={hairMaterial} />
            </>
          )}
          {backHairIndex === 3 && ( // Bob cut
            <Cylinder args={[0.72, 0.72, 0.6, 32]} position={[0, 0, -0.15]} material={hairMaterial} />
          )}
          {backHairIndex === 4 && ( // Long twintails
            <>
              <Cylinder args={[0.12, 0.08, 1.0, 16]} position={[-0.7, -0.6, -0.2]} rotation={[0, 0, 0.2]} material={hairMaterial} />
              <Cylinder args={[0.12, 0.08, 1.0, 16]} position={[0.7, -0.6, -0.2]} rotation={[0, 0, -0.2]} material={hairMaterial} />
            </>
          )}
          {backHairIndex === 5 && ( // Ponytail
            <>
              <Sphere args={[0.15, 16, 16]} position={[0, 0.35, -0.7]} material={hairMaterial} />
              <Sphere args={[0.22, 16, 16]} position={[0, 0.0, -0.85]} scale={[1, 2.2, 1]} rotation={[0.3, 0, 0]} material={hairMaterial} />
            </>
          )}
          {backHairIndex === 6 && ( // Volume Bob (Mushroom)
            <Sphere args={[0.74, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.45]} position={[0, 0.15, -0.05]} material={hairMaterial} />
          )}
          {backHairIndex === 7 && ( // Long Straight
            <>
              <RoundedBox args={[0.3, 1.2, 0.4]} position={[-0.6, -0.3, -0.1]} radius={0.15} material={hairMaterial} />
              <RoundedBox args={[0.3, 1.2, 0.4]} position={[0.6, -0.3, -0.1]} radius={0.15} material={hairMaterial} />
              <RoundedBox args={[1.2, 1.2, 0.3]} position={[0, -0.3, -0.5]} radius={0.15} material={hairMaterial} />
            </>
          )}
          {backHairIndex === 8 && ( // Odango (Two Buns)
            <>
              <Sphere args={[0.25, 16, 16]} position={[-0.5, 0.6, -0.1]} material={hairMaterial} />
              <Sphere args={[0.25, 16, 16]} position={[0.5, 0.6, -0.1]} material={hairMaterial} />
            </>
          )}

          {/* Front Hair */}
          {hatType === 1 && (
            <>
              {frontHairIndex === 2 && ( // Basic Bangs
                <Sphere args={[0.67, 32, 32]} position={[0, 0.15, -0.05]} material={hairMaterial} />
              )}
              {frontHairIndex === 3 && ( // Messy Curly - poofy top
                <>
                  <Sphere args={[0.22, 16, 16]} position={[-0.4, 0.5, 0.35]} material={hairMaterial} />
                  <Sphere args={[0.22, 16, 16]} position={[0.4, 0.5, 0.35]} material={hairMaterial} />
                  <Sphere args={[0.26, 16, 16]} position={[0, 0.62, 0.25]} material={hairMaterial} />
                  <Sphere args={[0.18, 16, 16]} position={[-0.2, 0.52, 0.52]} material={hairMaterial} />
                  <Sphere args={[0.18, 16, 16]} position={[0.2, 0.52, 0.52]} material={hairMaterial} />
                </>
              )}
              {frontHairIndex === 4 && ( // 깻잎머리: horizontal cylinder (axis=X), front arc = bangs
                <Cylinder
                  args={[0.25, 0.25, 1.0, 50, 1, true, -Math.PI / 2, Math.PI]}
                  position={[0, 0.25, 0.39]}
                  rotation={[0, 0, -Math.PI / 2]}
                  material={hairMaterial}
                />
              )}

              {frontHairIndex === 6 && ( // Antenna (Ahoge)
                <Cylinder args={[0.02, 0.05, 0.4, 8]} position={[0, 0.75, 0.1]} rotation={[0, 0, 0.3]} material={hairMaterial} />
              )}
            </>
          )}
        </group>

        {/* Hat */}
        {hatType === 2 && ( // Mushroom Hat
          <group position={[0, 0.35, 0]}>
            <Sphere args={[0.9, 32, 32]} position={[0, 0, 0]} scale={[1, 0.5, 1]} material={new THREE.MeshToonMaterial({ color: "#d94a38" })} />
            <Sphere args={[0.2, 16, 16]} position={[0, 0.4, 0.4]} material={new THREE.MeshBasicMaterial({ color: "white" })} />
            <Sphere args={[0.15, 16, 16]} position={[-0.5, 0.2, 0.2]} material={new THREE.MeshBasicMaterial({ color: "white" })} />
            <Sphere args={[0.18, 16, 16]} position={[0.4, 0.1, -0.3]} material={new THREE.MeshBasicMaterial({ color: "white" })} />
          </group>
        )}
        {hatType === 3 && ( // Beanie
          <group position={[0, 0.15, -0.05]}>
            <Sphere args={[0.72, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} scale={[1, 1.1, 1]} material={new THREE.MeshToonMaterial({ color: backpackColorHex })} />
            <Torus args={[0.72, 0.08, 16, 32]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={new THREE.MeshToonMaterial({ color: backpackColorHex })} />
            <Sphere args={[0.15, 16, 16]} position={[0, 0.85, 0]} material={new THREE.MeshToonMaterial({ color: backpackColorHex })} />
          </group>
        )}
      </group>

      {/* Body / Outfit Group */}
      <group position={[0, 0.3, 0]} scale={bodyScale}>

        {/* Outfits */}
        {outfitStyle === 1 && ( // Boxy Overalls
          <RoundedBox args={[0.85, 1.0, 0.65]} position={[0, 0, 0]} radius={0.25} smoothness={4} material={outfitMaterial} />
        )}
        {outfitStyle === 2 && ( // Dress (A-line)
          <Cylinder args={[0.38, 0.52, 1.0, 32]} position={[0, 0, 0]} material={outfitMaterial} />
        )}
        {outfitStyle === 3 && ( // Two-piece
          <>
            <RoundedBox args={[0.8, 0.6, 0.6]} position={[0, 0.2, 0]} radius={0.2} smoothness={4} material={outfitMaterial} />
            <RoundedBox args={[0.85, 0.4, 0.65]} position={[0, -0.3, 0]} radius={0.1} smoothness={4} material={new THREE.MeshToonMaterial({ color: "#425c7a" })} />
          </>
        )}

        {/* Backpack */}
        {backpackType === 2 && (
          <RoundedBox args={[0.6, 0.8, 0.3]} position={[0, 0.1, -0.52]} radius={0.1} smoothness={4} material={backpackMaterial} />
        )}

        {/* Arms with sleeves - Wrapped in animation refs */}
        <group ref={leftArm} position={[-0.55, 0.3, 0]}>
          <group rotation={[0, 0, 0.35]}>
            <Cylinder args={[0.13, 0.13, 0.3, 16]} position={[0, -0.15, 0]} material={outfitMaterial} />
            <Cylinder args={[0.1, 0.1, 0.3, 16]} position={[0, -0.45, 0]} material={skinMaterial} />
            <Sphere args={[0.1, 16, 16]} position={[0, -0.6, 0]} material={skinMaterial} />
            {backpackType === 3 && ( // Handbag (Tote)
              <group position={[0, -0.7, 0]} rotation={[0, 0, -0.2]}>
                <Torus args={[0.1, 0.02, 8, 16]} position={[0, 0.2, 0]} material={backpackMaterial} />
                <RoundedBox args={[0.3, 0.25, 0.15]} position={[0, 0, 0]} radius={0.05} material={backpackMaterial} />
              </group>
            )}
          </group>
        </group>

        <group ref={rightArm} position={[0.55, 0.3, 0]}>
          <group rotation={[0, 0, -0.35]}>
            <Cylinder args={[0.13, 0.13, 0.3, 16]} position={[0, -0.15, 0]} material={outfitMaterial} />
            <Cylinder args={[0.1, 0.1, 0.3, 16]} position={[0, -0.45, 0]} material={skinMaterial} />
            <Sphere args={[0.1, 16, 16]} position={[0, -0.6, 0]} material={skinMaterial} />
          </group>
        </group>
      </group>

      {/* Legs Group - Wrapped in animation refs */}
      <group position={[0, legY, 0]}>
        <group ref={leftLeg} position={[-0.2, 0, 0]}>
          <Cylinder args={[0.12, 0.12, 0.6, 16]} position={[0, 0, 0]} material={skinMaterial} />
          <RoundedBox args={[0.2, 0.15, 0.3]} position={[0, -0.3, 0.05]} radius={0.05} material={new THREE.MeshToonMaterial({ color: "#5c3a21" })} />
        </group>

        <group ref={rightLeg} position={[0.2, 0, 0]}>
          <Cylinder args={[0.12, 0.12, 0.6, 16]} position={[0, 0, 0]} material={skinMaterial} />
          <RoundedBox args={[0.2, 0.15, 0.3]} position={[0, -0.3, 0.05]} radius={0.05} material={new THREE.MeshToonMaterial({ color: "#5c3a21" })} />
        </group>
      </group>

    </group>
  );
}

export default function Character3D(props: Character3DProps) {
  const scale = props.characterSize ? props.characterSize / 100 : 1;

  return (
    <div className="w-full h-full absolute inset-0 flex items-end justify-center pb-6">
      <div style={{ width: `${100 * scale}%`, height: `${100 * scale}%`, transition: 'width 0.3s, height 0.3s', transformOrigin: 'bottom center' }}>
        <Canvas camera={{ position: [0, 0.4, 5.5], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 5, 0]} intensity={0.5} />

          <CharacterModel {...props} />

          {!props.hideControls && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 2.5}
              maxPolarAngle={Math.PI / 1.5}
              target={[0, 0.3, 0]}
            />
          )}
          <ContactShadows position={[0, -0.9, 0]} opacity={0.4} scale={5} blur={2} far={2} />
        </Canvas>
      </div>
    </div>
  );
}
