'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
    value?: number
    onChange?: (value: number) => void
    readOnly?: boolean
    max?: number
    size?: number
    interactive?: boolean
    className?: string
}

export function StarRating({
    value = 0,
    onChange,
    readOnly = false,
    max = 5,
    size = 16,
    className
}: StarRatingProps) {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null)

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: max }).map((_, i) => {
                const index = i + 1
                const filled = (hoverValue ?? value) >= index

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={readOnly}
                        onClick={() => !readOnly && onChange?.(index)}
                        onMouseEnter={() => !readOnly && setHoverValue(index)}
                        onMouseLeave={() => !readOnly && setHoverValue(null)}
                        className={cn(
                            "transition-colors focus:outline-none",
                            readOnly ? "cursor-default" : "cursor-pointer"
                        )}
                    >
                        <Star
                            size={size}
                            className={cn(
                                "transition-all",
                                filled ? "fill-amber-400 text-amber-400" : "fill-muted/20 text-muted-foreground",
                                !readOnly && "hover:scale-110"
                            )}
                        />
                    </button>
                )
            })}
        </div>
    )
}
