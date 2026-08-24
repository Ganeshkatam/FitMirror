'use client'

import { BottomNav } from '@/components/layout/bottom-nav'
import { FloatingAIButton } from '@/components/mobile/floating-ai-button'
import { useGenie } from '@/components/global-genie'

/**
 * Mobile shell — wraps bottom nav and floating AI button.
 * Connects both to the Genie AI dialog for a unified mobile experience.
 * Mobile-only: both child components use md:hidden.
 */
export function MobileShell() {
    const genie = useGenie()

    const handleAIClick = () => {
        genie?.setOpen(true)
    }

    return (
        <>
            <FloatingAIButton onClick={handleAIClick} />
            <BottomNav onAIClick={handleAIClick} />
        </>
    )
}
