'use client'

import { Badge } from '@/components/ui/badge'
import { Ruler, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SizeRecommenderProps {
    fitScore: number // 0-100
    recommendation: string
    className?: string
}

export function SizeRecommender({ fitScore, recommendation, className }: SizeRecommenderProps) {
    // 80+ = Great, 50-79 = Okay, <50 = Poor
    const isGood = fitScore >= 80
    const isBad = fitScore < 50

    return (
        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200", className)}>
            <div className={cn(
                "w-2 h-2 rounded-full",
                isGood ? "bg-green-500" : isBad ? "bg-red-500" : "bg-yellow-500"
            )} />

            <span className="text-xs font-semibold text-slate-700">
                {recommendation}
            </span>

            {isGood && <Check className="w-3 h-3 text-green-600" />}
            {isBad && <AlertCircle className="w-3 h-3 text-red-500" />}
        </div>
    )
}
