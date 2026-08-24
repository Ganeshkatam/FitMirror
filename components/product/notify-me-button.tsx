'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { subscribeToStockAlert } from '@/lib/actions/wishlist'

interface NotifyMeButtonProps {
    productId: string
    size?: string
    className?: string
}

export function NotifyMeButton({ productId, size, className }: NotifyMeButtonProps) {
    const [loading, setLoading] = React.useState(false)
    const [subscribed, setSubscribed] = React.useState(false)

    async function handleSubscribe() {
        setLoading(true)
        const result = await subscribeToStockAlert(productId, size)

        if (result.error) {
            toast.error(result.error)
        } else {
            setSubscribed(true)
            toast.success("We'll notify you when this is back in stock!")
        }
        setLoading(false)
    }

    if (subscribed) {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled
                className={className}
            >
                <BellOff className="mr-2 h-4 w-4" />
                Subscribed
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSubscribe}
            disabled={loading}
            className={className}
        >
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Bell className="mr-2 h-4 w-4" />
            )}
            Notify Me
        </Button>
    )
}
