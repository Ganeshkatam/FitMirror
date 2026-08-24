'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, useTexture, Decal, ContactShadows, Environment, Center } from '@react-three/drei'
import * as THREE from 'three'
import { useTryOnEngine, TryOnAsset } from '@/lib/try-on'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ZoomIn, Sparkles } from 'lucide-react'

// --- Internal 3D Components (To be moved to separate file if grows) ---

function GarmentLayer({ asset }: { asset: TryOnAsset }) {
    const texture = useTexture(asset.url)

    // Default Projection Config (MVP)
    const position: [number, number, number] = [0, 0.2, 0.31]
    const scale: [number, number, number] = [0.6, 0.6, 1]

    if (asset.layer === 1) { // Bottoms
        position[1] = -0.4
    }

    return (
        <Decal position={position} rotation={[0, 0, 0]} scale={scale}>
            <meshBasicMaterial
                map={texture as any}
                transparent
                polygonOffset
                polygonOffsetFactor={-asset.layer}
            />
        </Decal>
    )
}

function Mannequin() {
    const stack = useTryOnEngine(s => s.stack)
    // Memoize loading or pre-load textures handled by Suspense in Canvas

    return (
        <group dispose={null}>
            {/* Body */}
            <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
                <capsuleGeometry args={[0.3, 1.5, 4, 8]} />
                <meshStandardMaterial color="#e5e5e5" roughness={0.5} />

                {Object.values(stack).map((asset) => (
                    <GarmentLayer key={asset.id} asset={asset} />
                ))}
            </mesh>

            {/* Head */}
            <mesh position={[0, 1.65, 0]} castShadow>
                <sphereGeometry args={[0.22, 32, 32]} />
                <meshStandardMaterial color="#e5e5e5" roughness={0.5} />
            </mesh>
        </group>
    )
}

export function TryOnViewer() {
    const stack = useTryOnEngine(s => s.stack)
    const hasItems = Object.keys(stack).length > 0
    // const hasItems = false

    return (
        <div className="flex-1 relative bg-[#f0f0f0] dark:bg-[#1a1a1a] h-full min-h-[500px]">
            <Canvas shadows camera={{ position: [0, 0, 4.5], fov: 40 }}>
                <group position={[0, -0.9, 0]}>
                    <Center>
                        <Mannequin />
                    </Center>
                    <ambientLight intensity={0.7} />
                    <spotLight position={[5, 10, 7.5]} angle={0.3} penumbra={1} intensity={1} castShadow />
                    <ContactShadows resolution={1024} scale={10} blur={1} opacity={0.5} far={1} color="#000000" />
                    <Environment preset="city" />
                </group>
                <OrbitControls enablePan={false} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2} minDistance={3} maxDistance={6} />
            </Canvas>

            {/* Overlay UI */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
                    <ZoomIn size={20} />
                </Button>
            </div>

            {/* Stylist Tip */}
            {hasItems && (
                <div className="absolute bottom-8 right-8 w-80 animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="p-4 shadow-2xl border-none ring-1 ring-black/5 bg-white/90 backdrop-blur-md">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                <Sparkles size={14} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-indigo-600 mb-1">Stylist Check</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    The engine is active. Try mixing patterns for a bolder look.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
