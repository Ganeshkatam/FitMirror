"use client"

import { useAssistant } from './assistant-context'
import { Bot, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AssistantFab() {
    const { isOpen, toggleOpen } = useAssistant()

    return (
        <div className="hidden md:block fixed bottom-6 right-6 z-50">
            <button
                onClick={toggleOpen}
                className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:scale-110 active:scale-95",
                    isOpen ? "bg-destructive text-white rotate-90" : "bg-primary text-primary-foreground"
                )}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
            </button>
        </div>
    )
}
