'use client'

import React, { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { Fit } from '@/lib/try-on'

interface FitHeatmapProps {
    fitResult?: Fit.FitResult
    visible: boolean
}

export function FitHeatmap({ fitResult, visible }: FitHeatmapProps) {
    if (!visible || !fitResult) return null

    // Simple HTML Overlay for V1 (Simulating projection)
    // In a real physics engine, we would change the mesh texture or vertex colors.
    // Here we use 3D-positioned labels/dots to show hotspots.

    return (
        <group>
            {Object.entries(fitResult.zoneScores).map(([zone, score]) => {
                let position: [number, number, number] = [0, 0, 0]

                // Approximate positions on mannequin
                switch (zone) {
                    case 'chest': position = [0, 1.4, 0.15]; break;
                    case 'waist': position = [0, 1.1, 0.12]; break;
                    case 'hips': position = [0, 0.95, 0.14]; break;
                    case 'shoulders': position = [0, 1.55, 0]; break;
                }

                const color = score.status === 'tight' ? '#ef4444' :
                    score.status === 'loose' ? '#3b82f6' : '#22c55e'

                return (
                    <Html key={zone} position={position} center>
                        <div className="flex flex-col items-center">
                            <div
                                className="w-4 h-4 rounded-full border-2 border-white shadow-sm animate-pulse"
                                style={{ backgroundColor: color }}
                            />
                            <div className="mt-1 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded backdrop-blur-sm whitespace-nowrap capitalize">
                                {zone}: {score.status}
                            </div>
                        </div>
                    </Html>
                )
            })}
        </group>
    )
}
