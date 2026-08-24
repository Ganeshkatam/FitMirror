'use client'

import { useEffect, useRef } from 'react'
import { useCart } from '@/lib/store/cart'

export function CartInitializer() {
    const syncCart = useCart((state) => state.syncCart)
    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current) {
            syncCart()
            initialized.current = true
        }
    }, [syncCart])

    return null
}
