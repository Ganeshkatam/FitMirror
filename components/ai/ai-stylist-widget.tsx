'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePathname } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Sparkles, X, Send, ShoppingBag, RotateCcw,
    Maximize2, Minimize2, Volume2, VolumeX, Trash2,
    MessageSquare, User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TypingIndicator } from './typing-indicator'
import { ChatProductCard } from './chat-product-card'
import { QuickReplies, getSuggestionsForIntent } from './quick-replies'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useCart } from '@/lib/store/cart'

export interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    products?: any[]
    timestamp: Date
}

export function AIStylistWidget() {
    // ALL HOOKS MUST BE DECLARED FIRST - Before any conditional returns
    const [isOpen, setIsOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState('')
    const [lastIntent, setLastIntent] = useState<'welcome' | 'styling' | 'general'>('welcome')

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const pathname = usePathname()
    const cartItems = useCart(state => state.items)

    // AI Stylist is globally visible on all storefront routes
    useEffect(() => {
        setIsVisible(true)
    }, [pathname])

    // Scroll to bottom on new message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    // Initialize session ID
    useEffect(() => {
        setSessionId(crypto.randomUUID())
    }, [])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    }, [isOpen, isMinimized])

    // SMART GREETING & INITIALIZATION
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const initChat = async () => {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                // Get time of day
                const hour = new Date().getHours()
                const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

                let greeting = `Hey there! 👋 ${timeGreeting}. I'm your AI Stylist. I can help you find matchy outfits, suggest items for your cart, or answer style questions.`

                if (user) {
                    const name = user.user_metadata?.full_name?.split(' ')[0]
                    if (name) {
                        greeting = `${timeGreeting}, ${name}! 👋 Welcome back. I missed you! Ready to find a new look today?`
                    }
                }

                setMessages([{
                    id: 'welcome',
                    role: 'assistant',
                    content: greeting,
                    timestamp: new Date(),
                }])
            }

            // Small delay for natural feel
            const timer = setTimeout(initChat, 500)
            return () => clearTimeout(timer)
        }
    }, [isOpen, messages.length])

    // EARLY RETURN - After all hooks are declared
    if (!isVisible) return null

    const handleSendMessage = async (text?: string) => {
        const messageText = text || input.trim()
        if (!messageText) return

        // Add user message
        const newUserMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, newUserMsg])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, newUserMsg].map(m => ({ role: m.role, content: m.content })),
                    sessionId,
                    cartItems: cartItems.map(i => ({ name: i.productName }))
                })
            })

            const data = await response.json()

            if (data.role === 'assistant') {
                const newAiMsg: Message = {
                    id: data.id,
                    role: 'assistant',
                    content: data.content,
                    products: data.products,
                    timestamp: new Date(),
                }
                setMessages(prev => [...prev, newAiMsg])

                if (data.meta?.intent) {
                    setLastIntent(data.meta.intent)
                }
            }
        } catch (error) {
            console.error('Chat error:', error)
            toast.error("Failed to connect to AI Stylist")
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "I'm having a little trouble connecting right now. Please try again in a moment! 💕",
                timestamp: new Date()
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleClearChat = () => {
        setMessages([])
        setSessionId(crypto.randomUUID())
        toast.info("Memory cleared")
    }

    return (
        <>
            {/* Toggle Button (Floating) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xl flex items-center justify-center cursor-pointer group"
                    >
                        <Sparkles className="h-6 w-6 md:h-8 md:w-8 animate-pulse text-white" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className={cn(
                            "fixed z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border shadow-2xl overflow-hidden transition-all duration-300 flex flex-col",
                            isMinimized
                                ? "bottom-20 md:bottom-6 right-4 md:right-6 w-72 h-16 rounded-full"
                                : "bottom-20 md:bottom-6 right-4 md:right-6 w-[90vw] md:w-[400px] h-[70vh] md:h-[600px] max-h-[70vh] md:max-h-[80vh] rounded-2xl"
                        )}
                    >
                        {/* Header */}
                        <div className={cn(
                            "flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500/10 to-rose-500/10 border-b",
                            isMinimized && "h-full border-none cursor-pointer"
                        )}
                            onClick={() => isMinimized && setIsMinimized(false)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shadow-lg">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
                                        AI Stylist
                                    </h3>
                                    {!isMinimized && (
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Online & Ready
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {!isMinimized ? (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClearChat} title="Clear Memory">
                                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)}>
                                            <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600" onClick={() => setIsOpen(false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Body (Hidden if minimized) */}
                        {!isMinimized && (
                            <>
                                {/* Messages Area */}
                                <ScrollArea className="flex-1 p-4 bg-gray-50/50 dark:bg-black/20">
                                    <div className="space-y-4">
                                        {messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex w-full",
                                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                <div className={cn(
                                                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                                    msg.role === 'user'
                                                        ? "bg-gradient-to-br from-amber-500 to-rose-500 text-white rounded-tr-none"
                                                        : "bg-white dark:bg-gray-800 border text-gray-800 dark:text-gray-100 rounded-tl-none"
                                                )}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Product Cards Grid if products exist */}
                                        {messages.map((msg) => msg.products && msg.products.length > 0 && (
                                            <div key={`${msg.id}-products`} className="grid grid-cols-2 gap-2 pl-2">
                                                {msg.products.map((p, idx) => (
                                                    <ChatProductCard key={p.id} product={p} index={idx} />
                                                ))}
                                            </div>
                                        ))}

                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <TypingIndicator />
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>

                                {/* Quick Replies or Input */}
                                <div className="p-3 bg-white dark:bg-gray-900 border-t space-y-3">
                                    {!isLoading && messages.length > 0 && (
                                        <QuickReplies
                                            suggestions={getSuggestionsForIntent(lastIntent)}
                                            onSelect={handleSendMessage}
                                        />
                                    )}

                                    <div className="relative flex items-center gap-2">
                                        <Input
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Ask for style tips, outfit ideas..."
                                            className="pr-12 h-11 rounded-full border-gray-200 dark:border-gray-700 focus-visible:ring-amber-500 bg-gray-50 dark:bg-gray-800"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            size="icon"
                                            className="absolute right-1 w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md disabled:bg-gray-300"
                                            onClick={() => handleSendMessage()}
                                            disabled={!input.trim() || isLoading}
                                        >
                                            <Send className="h-4 w-4 ml-0.5" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
