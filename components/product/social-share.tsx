'use client'

import * as React from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SocialShareProps {
    productName: string
    productId: string
}

export function SocialShare({ productName, productId }: SocialShareProps) {
    const [copied, setCopied] = React.useState(false)

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/product/${productId}` : ''

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out ${productName} on FitMirror`,
                    text: `I found this amazing ${productName} on FitMirror!`,
                    url: shareUrl,
                })
            } catch (error) {
                console.error('Error sharing', error)
            }
        } else {
            // Fallback for desktop
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success('Link copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
    }

    // If native share is available and we are on mobile (simplified check), we could just show share button.
    // typically navigator.share is only on mobile.
    // For this UI we'll use a dropdown that offers options or just acts as a share button.

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                    <Share2 className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    Copy Link
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
