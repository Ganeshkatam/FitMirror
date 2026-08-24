'use client'

import { AskFitMirror } from '@/components/search'

/**
 * AI Search Button Wrapper
 * 
 * Client component wrapper for the AskFitMirror button.
 * Used in server component headers.
 */
export function AISearchButton() {
    return (
        <AskFitMirror
            placeholder="Search anything... 'red dresses under ₹2000'"
        />
    )
}
