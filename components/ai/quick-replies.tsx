'use client'

import { motion } from 'framer-motion'

interface QuickRepliesProps {
    suggestions: string[]
    onSelect: (suggestion: string) => void
    disabled?: boolean
}

export function QuickReplies({ suggestions, onSelect, disabled }: QuickRepliesProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex flex-wrap gap-2 mt-3"
        >
            {suggestions.map((suggestion, i) => (
                <motion.button
                    key={suggestion}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    onClick={() => onSelect(suggestion)}
                    disabled={disabled}
                    className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-900/30 dark:to-rose-900/30 border border-amber-200/50 dark:border-amber-700/30 hover:border-amber-300 dark:hover:border-amber-600 text-amber-700 dark:text-amber-300 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {suggestion}
                </motion.button>
            ))}
        </motion.div>
    )
}

// Intent-based suggestion generator
export function getSuggestionsForIntent(intent: string, lastMessage?: string): string[] {
    switch (intent) {
        case 'styling':
            return [
                "Show more options",
                "Something more casual",
                "Budget-friendly picks",
            ]
        case 'tryOn':
            return [
                "How does it work?",
                "Is it accurate?",
                "Try on this outfit",
            ]
        case 'support':
            return [
                "Return policy",
                "Track my order",
                "Contact support",
            ]
        default:
            return [
                "Help me find an outfit",
                "What's trending?",
                "Show me dresses",
            ]
    }
}
