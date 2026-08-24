'use client'

import React from 'react'
import { Search, Mic, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileSearchBarProps {
    onTap: () => void
    displayTerm?: string
    className?: string
}

export function MobileSearchBar({ onTap, displayTerm, className }: MobileSearchBarProps) {
    return (
        <div className={cn("md:hidden px-4 pb-2", className)}>
            <button
                onClick={onTap}
                className={cn(
                    "w-full flex items-center gap-2.5 h-10 px-3.5 rounded-lg text-sm transition-all",
                    "bg-gray-100 border border-gray-200/60",
                    "active:bg-gray-200 active:scale-[0.99]",
                    displayTerm
                        ? "text-gray-900"
                        : "text-gray-400"
                )}
            >
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-left truncate text-[13px]">
                    {displayTerm || "Search for brands, products..."}
                </span>
                <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
                    <Mic className="h-4 w-4 text-gray-400" />
                    <Camera className="h-4 w-4 text-gray-400" />
                </div>
            </button>
        </div>
    )
}
