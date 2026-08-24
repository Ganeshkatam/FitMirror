'use client'

import { useRef, useMemo, Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// Custom random sphere point generator to replace maath dependency
function generateSpherePoints(count: number, radius: number) {
    const points = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        // Random point on sphere surface using spherical coordinates
        const u = Math.random()
        const v = Math.random()
        const theta = 2 * Math.PI * u
        const phi = Math.acos(2 * v - 1)

        // Volume distribution (cube root ensures uniform distribution in volume)
        const r = Math.cbrt(Math.random()) * radius

        const x = r * Math.sin(phi) * Math.cos(theta)
        const y = r * Math.sin(phi) * Math.sin(theta)
        const z = r * Math.cos(phi)

        points[i * 3] = x
        points[i * 3 + 1] = y
        points[i * 3 + 2] = z
    }
    return points
}

function ParticleField(props: any) {
    const ref = useRef<any>(null)
    // Generate points once using useMemo to avoid regeneration on render
    const sphere = useMemo(() => generateSpherePoints(5000, 1.5), [])

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10
            ref.current.rotation.y -= delta / 15
        }
    })

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#fbbf24" // Amber-400
                    size={0.005}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    )
}

function FloatingShape() {
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <ParticleField />
        </Float>
    )
}

interface CinematicHeroProps {
    headline?: string
    subheadline?: string
}

export function CinematicHero({ headline, subheadline, className }: CinematicHeroProps & { className?: string }) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    return (
        <section className={cn("relative w-full h-[90vh] bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-fuchsia-100 via-violet-100 to-sky-100 overflow-hidden flex items-center justify-center", className)}>
            {/* 3D Background */}
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-multiply">
                {isMounted && (
                    <Canvas camera={{ position: [0, 0, 1] }}>
                        <Suspense fallback={null}>
                            <FloatingShape />
                        </Suspense>
                    </Canvas>
                )}
            </div>

            {/* Gradient Overlay for Saturation */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-0 pointer-events-none" />

            {/* Content */}
            <div className="container relative z-10 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-xl rounded-full border border-white/40 shadow-sm ring-1 ring-slate-900/5">
                        <Sparkles className="h-4 w-4 text-violet-600" />
                        <span className="text-sm font-semibold text-slate-800 uppercase tracking-widest">
                            AI-Powered Styling
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-serif font-bold text-slate-900 leading-tight tracking-tight drop-shadow-sm">
                        {headline ? (
                            <span dangerouslySetInnerHTML={{ __html: headline }} />
                        ) : (
                            <>
                                Fashion, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Reimagined.</span>
                            </>
                        )}
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        {subheadline || "Step into the future of shopping. Instantly visualize outfits on your digital twin with perfect accuracy."}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <Link href="/shop">
                            <Button className="h-14 px-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-lg font-bold gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                                Shop Collection <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/try-on/demo">
                            <Button variant="outline" className="h-14 px-8 rounded-full border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 hover:bg-white text-lg hover:border-slate-400 transition-all">
                                How It Works
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
