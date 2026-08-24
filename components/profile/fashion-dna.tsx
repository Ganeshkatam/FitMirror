'use client'

import React from 'react'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, Info } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function FashionDNA({ profile }: { profile?: any }) {
    // Map profile vector to radar data
    const vector = profile?.styleVector || {}

    // Default data if no profile
    const defaultData = [
        { subject: 'Trendy', A: 65, fullMark: 100 },
        { subject: 'Casual', A: 80, fullMark: 100 },
        { subject: 'Formal', A: 40, fullMark: 100 },
        { subject: 'Sporty', A: 55, fullMark: 100 },
        { subject: 'Edgy', A: 30, fullMark: 100 },
        { subject: 'Boho', A: 45, fullMark: 100 },
    ]

    // If we have real data, map it (mock mapping logic for now as vectors are category-based)
    // In a real app, we'd map "T-Shirts" -> "Casual", "Blazers" -> "Formal"
    const data = profile ? [
        { subject: 'Trendy', A: (vector['Dresses'] || 0) * 10 + 20, fullMark: 100 },
        { subject: 'Casual', A: (vector['T-Shirts'] || 0) * 10 + (vector['Jeans'] || 0) * 10 + 30, fullMark: 100 },
        { subject: 'Formal', A: (vector['Shirts'] || 0) * 10 + 10, fullMark: 100 },
        { subject: 'Sporty', A: (vector['Activewear'] || 0) * 10 + 10, fullMark: 100 },
        { subject: 'Edgy', A: (vector['Jackets'] || 0) * 10 + 10, fullMark: 100 },
        { subject: 'Boho', A: (vector['Skirts'] || 0) * 10 + 10, fullMark: 100 },
    ].map(d => ({ ...d, A: Math.min(d.A, 100) })) : defaultData

    return (
        <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        Fashion DNA
                    </CardTitle>
                    <Popover>
                        <PopoverTrigger>
                            <Info className="h-4 w-4 text-gray-400 hover:text-indigo-500 transition-colors" />
                        </PopoverTrigger>
                        <PopoverContent className="w-64 text-xs text-gray-600">
                            Analysis based on your purchase history and try-on sessions.
                        </PopoverContent>
                    </Popover>
                </div>
                <CardDescription>Your unique style fingerprint</CardDescription>
            </CardHeader>

            <CardContent className="h-[250px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Style Score"
                            dataKey="A"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="#818cf8"
                            fillOpacity={0.4}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>

                <div className="absolute bottom-0 w-full text-center text-xs text-gray-400 font-medium">
                    Style Archetype: <span className="text-indigo-600 font-bold">Urban Casual</span>
                </div>
            </CardContent>
        </Card>
    )
}
