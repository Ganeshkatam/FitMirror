'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { useTryOnStore } from '@/lib/store/use-try-on'

// Placeholder Avatar Component
function AvatarModel() {
    // In a real app, we would load a generic GLB here:
    // const { scene } = useGLTF('/models/avatar_base.glb')
    // return <primitive object={scene} />

    const { avatarConfig } = useTryOnStore()

    // Calculate scale factors based on config
    // Height: 150-200cm maps to 0.85-1.15 scale
    const heightScale = 0.85 + ((avatarConfig.height - 150) / 50) * 0.3
    // Weight: 40-120kg maps to 0.8-1.3 horizontal scale
    const weightScale = 0.8 + ((avatarConfig.weight - 40) / 80) * 0.5
    // Gender affects body proportions slightly
    const bodyWidth = avatarConfig.gender === 'male' ? 0.28 : 0.25
    const shoulderWidth = avatarConfig.gender === 'male' ? 0.32 : 0.26

    return (
        <group position={[0, -1 * heightScale, 0]} scale={[1, heightScale, 1]}>
            {/* Simple geometric placeholder for the avatar */}
            {/* Body */}
            <mesh position={[0, 0.75, 0]} scale={[weightScale, 1, weightScale * 0.8]}>
                <capsuleGeometry args={[bodyWidth, 1.5, 4, 8]} />
                <meshStandardMaterial color={avatarConfig.skinTone} roughness={0.5} />
            </mesh>

            {/* Shoulders (wider for male) */}
            <mesh position={[0, 1.3, 0]} scale={[weightScale, 1, weightScale * 0.6]}>
                <boxGeometry args={[shoulderWidth * 2.5, 0.15, 0.15]} />
                <meshStandardMaterial color={avatarConfig.skinTone} roughness={0.5} />
            </mesh>

            {/* Head */}
            <mesh position={[0, 1.6, 0]}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color={avatarConfig.skinTone} roughness={0.5} />
            </mesh>

            {/* Platform */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.6, 32]} />
                <meshStandardMaterial color="white" transparent opacity={0.5} />
            </mesh>
        </group>
    )
}

function SceneLights() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <Environment preset="city" />
        </>
    )
}

export function AvatarCanvas() {
    return (
        <div className="w-full h-full relative bg-gradient-to-b from-gray-50 to-gray-200">
            <Canvas shadows camera={{ position: [0, 1, 3], fov: 45 }}>
                <Suspense fallback={null}>
                    <SceneLights />
                    <AvatarModel />
                    <OrbitControls
                        enablePan={false}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 2}
                        minDistance={2}
                        maxDistance={5}
                    />
                </Suspense>
            </Canvas>

            {/* Loading Overlay (if needed) */}
            {/* <div className="absolute inset-0 flex items-center justify-center bg-white/80 pointer-events-none">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div> */}
        </div>
    )
}
