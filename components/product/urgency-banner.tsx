'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface UrgencyBannerProps {
    productId: string
    variantId?: string | null
    size?: string | null
}

export function UrgencyBanner({ productId, variantId, size }: UrgencyBannerProps) {
    const [stock, setStock] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!size) {
            setStock(null)
            return
        }

        async function fetchStock() {
            setLoading(true)
            // Fetch real stock for specific size
            const { data, error } = await supabase
                .from('product_inventory')
                .select('stock')
                .eq('product_id', productId)
                .eq('size', size)
                .single()

            if (!error && data) {
                setStock(data.stock)
            }
            setLoading(false)
        }

        fetchStock()
    }, [productId, size, supabase])

    if (!size || stock === null || loading) return null

    // Logic: Only show urgency if stock is low (e.g. < 10)
    if (stock > 10) return null
    if (stock === 0) return (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-md text-sm font-medium mt-3">
            <AlertTriangle className="h-4 w-4" />
            Out of Stock
        </div>
    )

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium mt-3 animate-in fade-in slide-in-from-bottom-2",
            stock <= 3 ? "bg-red-50 text-red-700 border border-red-100" : "bg-amber-50 text-amber-700 border border-amber-100"
        )}>
            <TrendingUp className="h-4 w-4" />
            {stock === 1 ? (
                <span>Hurry! Only <strong>1</strong> left in {size}</span>
            ) : (
                <span>Low Stock: Only <strong>{stock}</strong> left in {size}</span>
            )}
        </div>
    )
}
