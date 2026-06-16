"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

export interface Animal3DProps {
  species?: "cat" | "dog";
  furColor?: string;
  eyeShape?: "round" | "sleepy" | "wide";
  accessory?: "none" | "ribbon" | "hat" | "necklace" | "glasses";
  accessoryColor?: string;
}

function CatModel({ furColor, eyeShape, accessory, accessoryColor }: any) {
  const group = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 2) * 0.2 + 0.2;
    }
    if (group.current) {
      group.current.position.y = Math.sin(t * 2) * 0.05;
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]}>
      {/* Body */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={furColor} roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color={furColor} roughness={0.8} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.4, 2.8, 0]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.3, 0.6, 16]} />
        <meshStandardMaterial color={furColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.4, 2.8, 0]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.3, 0.6, 16]} />
        <meshStandardMaterial color={furColor} roughness={0.8} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.3, 2.3, 0.75]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#111" roughness={0.2} />
      </mesh>
      <mesh position={[0.3, 2.3, 0.75]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#111" roughness={0.2} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 2.1, 0.8]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FFAEC9" roughness={0.5} />
      </mesh>

      {/* Tail */}
      <group position={[0, 0.5, -0.9]} ref={tailRef}>
        <mesh position={[0, 0.5, -0.2]} rotation={[-0.5, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.15, 1.2, 16]} />
          <meshStandardMaterial color={furColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Accessory: Hat */}
      {accessory === "hat" && (
        <mesh position={[0, 3.1, 0]} rotation={[-0.1, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.4, 32]} />
          <meshStandardMaterial color={accessoryColor} roughness={0.4} />
        </mesh>
      )}

      {/* Accessory: Ribbon */}
      {accessory === "ribbon" && (
        <mesh position={[0, 1.6, 0.8]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.2, 0.1]} />
          <meshStandardMaterial color={accessoryColor} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

function DogModel({ furColor, eyeShape, accessory, accessoryColor }: any) {
  const group = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (tailRef.current) {
      tailRef.current.rotation.x = Math.sin(t * 15) * 0.3; // wagging fast
    }
    if (group.current) {
      group.current.position.y = Math.sin(t * 3) * 0.05;
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]}>
      {/* Body */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.8, 0.9, 1.8, 32]} />
        <meshStandardMaterial color={furColor} roughness={0.9} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.2, 0.4]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color={furColor} roughness={0.9} />
      </mesh>

      {/* Snout */}
      <mesh position={[0, 2.0, 1.0]} rotation={[-0.2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 32]} />
        <meshStandardMaterial color={furColor} roughness={0.9} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 2.0, 1.3]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#222" roughness={0.4} />
      </mesh>

      {/* Floppy Ears */}
      <mesh position={[-0.6, 2.1, 0.2]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.2, 0.6, 16, 16]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.9} />
      </mesh>
      <mesh position={[0.6, 2.1, 0.2]} rotation={[0, 0, -0.4]}>
        <capsuleGeometry args={[0.2, 0.6, 16, 16]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.9} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.3, 2.4, 0.9]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#111" roughness={0.2} />
      </mesh>
      <mesh position={[0.3, 2.4, 0.9]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#111" roughness={0.2} />
      </mesh>

      {/* Tail */}
      <group position={[0, 0.8, -0.8]} ref={tailRef}>
        <mesh position={[0, 0.4, -0.2]} rotation={[0.5, 0, 0]}>
          <capsuleGeometry args={[0.15, 0.6, 16, 16]} />
          <meshStandardMaterial color={furColor} roughness={0.9} />
        </mesh>
      </group>

      {/* Accessory: Hat */}
      {accessory === "hat" && (
        <mesh position={[0, 3.1, 0.4]} rotation={[-0.1, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.4, 32]} />
          <meshStandardMaterial color={accessoryColor} roughness={0.4} />
        </mesh>
      )}

      {/* Accessory: Ribbon */}
      {accessory === "ribbon" && (
        <mesh position={[0, 1.5, 1.1]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.2, 0.1]} />
          <meshStandardMaterial color={accessoryColor} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

export default function Animal3D({
  species = "cat",
  furColor = "#A89BC0",
  eyeShape = "round",
  accessory = "none",
  accessoryColor = "#FF6B6B",
}: Animal3DProps) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={1024}
        />
        <Environment preset="city" />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
          minDistance={3}
          maxDistance={10}
        />

        {species === "cat" ? (
          <CatModel
            furColor={furColor}
            eyeShape={eyeShape}
            accessory={accessory}
            accessoryColor={accessoryColor}
          />
        ) : (
          <DogModel
            furColor={furColor}
            eyeShape={eyeShape}
            accessory={accessory}
            accessoryColor={accessoryColor}
          />
        )}

        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.5}
          scale={10}
          blur={2}
          far={4}
        />
      </Canvas>
    </div>
  );
}
