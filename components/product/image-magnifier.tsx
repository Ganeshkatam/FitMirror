"use client"

import React, { useState, MouseEvent } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageMagnifierProps {
    src: string
    alt: string
    className?: string
}

export function ImageMagnifier({ src, alt, className }: ImageMagnifierProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [showZoom, setShowZoom] = useState(false)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect()

        // Calculate percentage position
        const x = ((e.pageX - left) / width) * 100
        const y = ((e.pageY - top) / height) * 100

        setPosition({ x, y })
        setCursorPosition({ x: e.pageX - left, y: e.pageY - top })
    }

    return (
        <div
            className={cn("relative overflow-hidden cursor-crosshair group", className)}
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
            onMouseMove={handleMouseMove}
        >
            <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
                unoptimized
            />

            {/* Zoom Lens/Result - Only visible on desktop/hover */}
            <div
                className={cn(
                    "absolute inset-0 bg-no-repeat pointer-events-none opacity-0 transition-opacity duration-200 hidden md:block",
                    showZoom && "opacity-100"
                )}
                style={{
                    backgroundImage: `url(${src})`,
                    backgroundPosition: `${position.x}% ${position.y}%`,
                    backgroundSize: '250%', // 2.5x zoom
                }}
            />
        </div>
    )
}
