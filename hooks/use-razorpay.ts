'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'

declare global {
    interface Window {
        Razorpay: any
    }
}

interface UseRazorpayOptions {
    onSuccess: (response: { paymentId: string }) => void
    onError?: (error: any) => void
}

export function useRazorpay({ onSuccess, onError }: UseRazorpayOptions) {
    const loadScript = useCallback(() => {
        return new Promise<boolean>((resolve) => {
            if (document.getElementById('razorpay-script')) {
                resolve(true)
                return
            }
            const script = document.createElement('script')
            script.id = 'razorpay-script'
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => resolve(true)
            script.onerror = () => resolve(false)
            document.body.appendChild(script)
        })
    }, [])

    const initiatePayment = useCallback(async (amount: number, orderId: string, userInfo?: { name?: string; email?: string; phone?: string }) => {
        const loaded = await loadScript()
        if (!loaded) {
            toast.error('Failed to load payment gateway')
            return
        }

        // Create Razorpay order on backend
        const res = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, orderId })
        })

        if (!res.ok) {
            const err = await res.json()
            toast.error(err.error || 'Failed to create payment')
            onError?.(err)
            return
        }

        const data = await res.json()

        const options = {
            key: data.key,
            amount: data.amount,
            currency: data.currency,
            name: 'FitMirror',
            description: `Order #${orderId.slice(0, 8)}`,
            order_id: data.id,
            handler: async function (response: any) {
                // Verify payment on backend
                const verifyRes = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        order_id: orderId
                    })
                })

                if (verifyRes.ok) {
                    onSuccess({ paymentId: response.razorpay_payment_id })
                } else {
                    toast.error('Payment verification failed')
                    onError?.({ message: 'Verification failed' })
                }
            },
            prefill: {
                name: userInfo?.name || '',
                email: userInfo?.email || '',
                contact: userInfo?.phone || ''
            },
            theme: {
                color: '#f59e0b' // Amber-500
            },
            modal: {
                ondismiss: function () {
                    toast.info('Payment cancelled')
                }
            }
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
    }, [loadScript, onSuccess, onError])

    return { initiatePayment }
}
