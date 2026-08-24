'use client'

import { motion } from 'framer-motion'

export function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 px-4 py-3">
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-gradient-to-br from-amber-400 to-rose-400 rounded-full"
                        animate={{
                            y: [0, -6, 0],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
            <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
        </div>
    )
}
