'use client'

import * as React from 'react'

import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

interface DataUsageHintProps {
    message: string
    className?: string
}

export function DataUsageHint({ message, className }: DataUsageHintProps) {
    // Refactored to be pure for now to separate from app logic
    const show = true // Default to true or pass as prop if needed

    if (!show) return null

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={className}>
                        <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs">
                    <p className="text-muted-foreground">🔒 {message}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
