'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, X, Send, User, Bot, Shirt } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

import { trackEvent } from '@/lib/analytics/tracker'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    products?: any[]
}

export function StylistChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your personal AI stylist. Looking for an outfit for a specific occasion?"
        }
    ])
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isTyping])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])

        // Track Interaction
        trackEvent({
            eventType: 'ai_chat',
            storeId: 'platform',
            metadata: { query: input }
        })

        setInput('')
        setIsTyping(true)

        // Mock AI Delay
        setTimeout(() => {
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: generateResponse(userMsg.content)
            }
            setMessages(prev => [...prev, aiMsg])
            setIsTyping(false)
        }, 1500)
    }

    const generateResponse = (text: string): string => {
        const t = text.toLowerCase()
        if (t.includes('party') || t.includes('dress')) return "For a party, I highly recommend our Midnight Velvet Dress. It pairs perfectly with silver accessories."
        if (t.includes('gym') || t.includes('workout')) return "Check out our ProFit Leggings and Breathable Mesh Top. Maximum comfort for high performance."
        if (t.includes('office') || t.includes('work')) return "The Classic Blazer is a must-have. Combine it with our Chino Pants for a smart-casual look."
        return "I can help you find the perfect look. Tell me where you're going!"
    }

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4"
                    >
                        <Card className="w-[350px] h-[500px] shadow-2xl border-amber-100 flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/10 rounded-full">
                                        <Sparkles className="h-4 w-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">FitMirror Stylist</h3>
                                        <p className="text-[10px] text-gray-300 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            Online
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Chat Area */}
                            <ScrollArea className="flex-1 p-4 bg-gray-50" ref={scrollRef}>
                                <div className="space-y-4">
                                    {messages.map(m => (
                                        <div key={m.id} className={cn("flex gap-2 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                                m.role === 'assistant' ? "bg-black text-white" : "bg-gray-200"
                                            )}>
                                                {m.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                            </div>
                                            <div className={cn(
                                                "p-3 rounded-2xl text-sm shadow-sm",
                                                m.role === 'assistant'
                                                    ? "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                                                    : "bg-black text-white rounded-tr-none"
                                            )}>
                                                {m.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex gap-2">
                                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                                                <Bot className="h-4 w-4" />
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1 items-center">
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <div className="p-3 border-t bg-white flex gap-2">
                                <Input
                                    className="flex-1 focus-visible:ring-black"
                                    placeholder="Ask about style..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <Button size="icon" className="bg-black hover:bg-gray-800" onClick={handleSend}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-14 w-14 rounded-full bg-black text-white shadow-xl flex items-center justify-center relative group"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                )}
            </motion.button>
        </div>
    )
}
