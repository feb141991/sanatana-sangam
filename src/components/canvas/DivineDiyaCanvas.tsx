'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function SacredFlame() {
  const innerFlameRef = useRef<THREE.Mesh>(null!);
  const outerFlameRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (innerFlameRef.current) {
      innerFlameRef.current.scale.x = 1 + Math.sin(t * 12) * 0.08;
      innerFlameRef.current.scale.y = 1 + Math.cos(t * 15) * 0.12;
      innerFlameRef.current.position.y = 0.5 + Math.sin(t * 10) * 0.03;
    }
    if (outerFlameRef.current) {
      outerFlameRef.current.scale.x = 1 + Math.cos(t * 10) * 0.06;
      outerFlameRef.current.scale.y = 1 + Math.sin(t * 14) * 0.1;
      outerFlameRef.current.position.y = 0.5 + Math.cos(t * 8) * 0.02;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Flame Glow */}
      <mesh ref={outerFlameRef} position={[0, 0.5, 0]}>
        <coneGeometry args={[0.35, 1.2, 32]} />
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#D97706"
          emissiveIntensity={1.5}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Inner Core Flame */}
      <mesh ref={innerFlameRef} position={[0, 0.45, 0]}>
        <coneGeometry args={[0.2, 0.8, 32]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#FBBF24"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Flame Base Wick */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
    </group>
  );
}

function ClayDiyaBowl() {
  return (
    <group position={[0, -0.4, 0]}>
      {/* Diya Clay Base */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.4, 0.5, 32]} />
        <meshStandardMaterial
          color="#B45309"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Brass / Gold Rim */}
      <mesh position={[0, 0.26, 0]}>
        <torusGeometry args={[0.88, 0.06, 16, 32]} />
        <meshStandardMaterial
          color="#F59E0B"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

export default function DivineDiyaCanvas() {
  return (
    <div className="w-full h-72 rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/20 shadow-2xl relative group">
      <div className="absolute top-4 left-6 z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Interactive 3D Sadhana Light
        </span>
      </div>

      <Canvas
        camera={{ position: [0, 1.2, 3.5], fov: 45 }}
        frameloop="always"
        className="cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 1, 0]} intensity={3} color="#FBBF24" distance={5} />
        <directionalLight position={[3, 5, 2]} intensity={1} color="#FED7AA" />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <SacredFlame />
          <ClayDiyaBowl />
        </Float>

        <Sparkles
          count={40}
          scale={3}
          size={2}
          speed={0.4}
          opacity={0.6}
          color="#FCD34D"
        />

        <OrbitControls
          enableZoom={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}
