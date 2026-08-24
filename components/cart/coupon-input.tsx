'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/lib/store/cart'
import { Loader2, Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function CouponInput() {
    const { coupon, applyCoupon, removeCoupon } = useCart()
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setLoading(true)
        try {
            const result = await applyCoupon(code.trim())
            if (result.success) {
                toast.success('Coupon applied successfully!')
                setCode('')
            } else {
                toast.error(result.message || 'Invalid coupon')
            }
        } catch (error) {
            toast.error('Failed to apply coupon')
        } finally {
            setLoading(false)
        }
    }

    if (coupon) {
        return (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <div>
                        <p className="text-sm font-medium text-green-900">
                            Code: <span className="font-mono">{coupon.code}</span>
                        </p>
                        <p className="text-xs text-green-700">
                            -₹{coupon.discountAmount.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-green-100 text-green-600"
                    onClick={() => {
                        removeCoupon()
                        toast.info('Coupon removed')
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleApply} className="flex gap-2">
            <Input
                placeholder="Discount Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-10 bg-white"
                disabled={loading}
            />
            <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-10 px-4"
                disabled={loading || !code.trim()}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
        </form>
    )
}
