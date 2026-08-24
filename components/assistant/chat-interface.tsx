"use client"

import { useAssistant } from './assistant-context'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function AssistantChat() {
    const { isOpen, messages, sendMessage, isTyping } = useAssistant()
    const [input, setInput] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isTyping, isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return
        sendMessage(input)
        setInput('')
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="hidden md:flex fixed bottom-24 right-6 z-50 w-[380px] h-[600px] flex-col glass rounded-2xl shadow-2xl overflow-hidden border-white/20"
                >
                    {/* Header */}
                    <div className="flex items-center p-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm animate-pulse" />
                                <Avatar className="h-10 w-10 border-2 border-white shadow-lg relative z-10">
                                    <AvatarImage src="/genie-avatar.png" alt="AI Stylist" />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center">
                                        <Sparkles className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Style Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <p className="text-xs text-muted-foreground/80">Online & Ready</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                        <div className="flex flex-col gap-4">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground/60 space-y-4">
                                    <Sparkles className="h-12 w-12 opacity-20" />
                                    <p className="text-sm">Ask me about the latest trends, find your perfect fit, or get styling advice!</p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex w-max max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur-md",
                                        msg.role === 'user'
                                            ? "ml-auto bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-white/40 dark:bg-black/40 border border-white/20 rounded-tl-sm"
                                    )}
                                >
                                    {msg.content}
                                    {msg.action && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {msg.action.type === 'NAVIGATE' && (
                                                <a href={msg.action.payload?.url} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full shadow-md transition-colors flex items-center gap-1">
                                                    Go Now 🚀
                                                </a>
                                            )}
                                            {msg.action.type === 'TRY_ON' && (
                                                <a href="/try-on" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-full shadow-md transition-colors flex items-center gap-1">
                                                    Open Mirror ✨
                                                </a>
                                            )}
                                            {msg.action.type === 'SEARCH' && (
                                                <a href={`/shop?q=${encodeURIComponent(msg.action.payload?.query || '')}`} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-full shadow-md transition-colors flex items-center gap-1">
                                                    View Results 🔍
                                                </a>
                                            )}
                                            {msg.action.type === 'ORDER_TRACKING' && (
                                                <div className="flex flex-col gap-2 p-3 bg-white/10 rounded-xl border border-white/10 w-full mt-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-muted-foreground">Order Status</span>
                                                        <span className="text-xs font-bold text-green-400">ON TIME</span>
                                                    </div>
                                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-400 w-[70%]" />
                                                    </div>
                                                    <a href="/orders" className="text-xs text-blue-300 hover:underline text-center mt-1">
                                                        View Details
                                                    </a>
                                                </div>
                                            )}
                                            {msg.action.type === 'STYLE_HELP' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => window.location.href = '/shop?category=new'} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs rounded-lg border border-white/10 transition-colors">
                                                        Shop Look 🛍️
                                                    </button>
                                                    <button onClick={() => window.location.href = '/try-on'} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs rounded-lg border border-white/10 transition-colors">
                                                        Try On 👗
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex items-center space-x-1 p-3 w-max bg-white/40 dark:bg-black/40 rounded-2xl rounded-tl-sm border border-white/10">
                                    <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" />
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
                        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about trends, sizes..."
                                className="pr-12 rounded-full border-white/20 bg-white/10 focus-visible:ring-offset-0 focus-visible:bg-white/20 transition-all placeholder:text-muted-foreground/70"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim()}
                                className="absolute right-1 top-1 h-8 w-8 rounded-full shadow-md transition-transform active:scale-95"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
