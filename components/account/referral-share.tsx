'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Share2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ReferralShareProps {
    code: string
}

export function ReferralShare({ code }: ReferralShareProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            toast.success('Referral code copied!')
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error('Failed to copy code')
        }
    }

    const handleShare = async () => {
        const shareData = {
            title: 'Join me on FitMirror!',
            text: `Use my code ${code} to get ₹500 off your first purchase!`,
            url: window.location.origin
        }

        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData)
                toast.success('Shared successfully!')
            } catch (err) {
                // Ignore abort errors
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed', err)
                }
            }
        } else {
            handleCopy()
        }
    }

    return (
        <div className="flex flex-col gap-4 items-center">
            <div className="flex items-center gap-2 w-full max-w-xs mx-auto bg-white/10 backdrop-blur-sm p-1.5 rounded-lg border border-white/20">
                <div className="flex-1 text-center font-mono font-bold tracking-wider text-xl">
                    {code}
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white text-indigo-600 hover:bg-white/90"
                    onClick={handleCopy}
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>

            <Button
                onClick={handleShare}
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm w-full max-w-xs"
            >
                <Share2 className="mr-2 h-4 w-4" /> Share with Friends
            </Button>
        </div>
    )
}
