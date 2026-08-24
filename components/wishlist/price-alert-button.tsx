'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellRing, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { subscribeToPriceAlert } from '@/lib/actions/wishlist'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface PriceAlertButtonProps {
    productId: string
    currentPrice: number
}

export function PriceAlertButton({ productId, currentPrice }: PriceAlertButtonProps) {
    const [loading, setLoading] = useState(false)
    const [subscribed, setSubscribed] = useState(false)

    const handleSubscribe = async () => {
        if (subscribed) return // Already subscribed (Optimistic or real state)

        setLoading(true)
        try {
            const result = await subscribeToPriceAlert(productId, currentPrice)
            if (result.error) {
                toast.error(result.error)
            } else {
                setSubscribed(true)
                toast.success('We\'ll email you if the price drops!')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    if (subscribed) {
        return (
            <div className="absolute top-2 left-2 z-10">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 border border-yellow-200 shadow-sm"
                            >
                                <BellRing className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Price alert active</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        )
    }

    return (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-white"
                            onClick={handleSubscribe}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Bell className="h-4 w-4 text-gray-600" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Notify me on price drop</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
