'use client'

import { useState, useRef, useEffect, FormEvent, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
    Send, User, Sparkles, Plus, Loader2,
    Package, ShoppingCart, Tag, TrendingUp, AlertTriangle,
    Zap, MessageSquare, History, Trash2, type LucideIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { detectIntent } from '@/lib/assistant/engine'
import { getBestSkill } from '@/lib/assistant/registry'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    products?: any[]
}

interface ChatSession {
    id: string
    title: string
    created_at: string
}

// Quick actions
// Quick actions — aligned to registered skills
const customerActions = [
    { label: 'Find Products', prompt: 'Show me black running shoes under ₹3000', icon: Tag },
    { label: 'Style Advice', prompt: 'What should I wear to a wedding?', icon: Sparkles },
    { label: 'My Orders', prompt: 'Where is my last order?', icon: Package },
    { label: 'My Wishlist', prompt: 'Go to wishlist', icon: Tag },
    { label: 'Get Support', prompt: 'I need help with a return', icon: MessageSquare },
    { label: 'Trending Now', prompt: 'Show me trending outfits this season', icon: TrendingUp },
    { label: 'My Closet', prompt: 'Open my closet', icon: Package },
    { label: 'Dark Mode', prompt: 'Switch to dark mode', icon: Zap },
]



// Context for global access
interface GenieContextType {
    open: boolean
    setOpen: (open: boolean) => void
    sendMessage: (message: string, context?: any) => void
}

const GenieContext = createContext<GenieContextType | null>(null)

export function useGenie() {
    const context = useContext(GenieContext)
    if (!context) {
        throw new Error('useGenie must be used within GenieProvider')
    }
    return context
}

export function GenieProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [pendingMessage, setPendingMessage] = useState<string | null>(null)

    const sendMessage = (message: string, context?: any) => {
        const fullMessage = context
            ? `${message}\n\n**Context:**\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``
            : message
        setPendingMessage(fullMessage)
        setOpen(true)
    }

    return (
        <GenieContext.Provider value={{ open, setOpen, sendMessage }}>
            {children}
            <GlobalGenie
                open={open}
                onOpenChange={setOpen}
                pendingMessage={pendingMessage}
                onPendingMessageConsumed={() => setPendingMessage(null)}
            />
        </GenieContext.Provider>
    )
}

interface GlobalGenieProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pendingMessage: string | null
    onPendingMessageConsumed: () => void
}

function GlobalGenie({ open, onOpenChange, pendingMessage, onPendingMessageConsumed }: GlobalGenieProps) {
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [showHistory, setShowHistory] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const router = useRouter()
    const pathname = usePathname()
    const { setTheme } = useTheme()

    // Handle pending message
    useEffect(() => {
        if (pendingMessage && open) {
            setInput(pendingMessage)
            onPendingMessageConsumed()
            // Auto-submit after a short delay
            setTimeout(() => {

                handleSubmitWithMessage(pendingMessage)
            }, 100)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingMessage, open])

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    // Load sessions when opened
    useEffect(() => {
        if (open) loadSessions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // Global Shortcut (Cmd+K)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                onOpenChange(!open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [open, onOpenChange])

    const loadSessions = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('copilot_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(10)

        if (data) setSessions(data)
    }

    const loadSession = async (sessionId: string) => {
        setCurrentSessionId(sessionId)
        setShowHistory(false)

        const { data } = await supabase
            .from('copilot_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })

        if (data) {
            setMessages(data.map(m => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })))
        }
    }

    const startNewChat = () => {
        setMessages([])
        setCurrentSessionId(null)
        setShowHistory(false)
    }

    const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        await supabase.from('copilot_sessions').delete().eq('id', sessionId)
        setSessions(sessions.filter(s => s.id !== sessionId))
        if (currentSessionId === sessionId) startNewChat()
    }

    const saveMessage = async (sessionId: string, role: string, content: string) => {
        await supabase.from('copilot_messages').insert({ session_id: sessionId, role, content })
    }

    const handleSubmitWithMessage = async (messageContent: string) => {
        if (!messageContent.trim() || isLoading) return

        const userMessage: Message = {
            id: Math.random().toString(36).slice(2) + Date.now().toString(36),
            role: 'user',
            content: messageContent.trim(),
        }

        const allMessages = [...messages, userMessage]
        setMessages(allMessages)
        setInput('')
        setIsLoading(true)

        let sessionId = currentSessionId
        const { data: { user } } = await supabase.auth.getUser()

        if (!sessionId && user) {
            const title = messageContent.trim().slice(0, 40) + (messageContent.length > 40 ? '...' : '')
            const { data: newSession } = await supabase
                .from('copilot_sessions')
                .insert({ user_id: user.id, title })
                .select()
                .single()

            if (newSession) {
                sessionId = newSession.id
                setCurrentSessionId(sessionId)
                setSessions(prev => [newSession, ...prev])
            }
        }

        if (sessionId) await saveMessage(sessionId, 'user', userMessage.content)

        if (sessionId) await saveMessage(sessionId, 'user', userMessage.content)

        try {
            // --- Local Engine Execution ---
            const intent = detectIntent(userMessage.content)
            const skill = getBestSkill(intent)

            let responseContent = ''

            let responseProducts: any[] | undefined

            if (skill && intent.confidence > 0.6) {
                // Execute Skill
                // We pass context: { router, setTheme, supabase }
                const result = await skill.execute(intent, { router, setTheme, supabase })

                if (result.success) {
                    responseContent = `✅ ${result.message}`
                    if (result.data) responseProducts = result.data
                    if (result.action) {
                        result.action() // Execute UI side effect immediately
                    }
                } else {
                    responseContent = `❌ I tried to run ${skill.name} but failed: ${result.message}`
                }
            } else {
                // Fallback to "Chat" (or just say I don't know for MVP)
                // For now, simple echo or mock response to avoid API complexity in this phase
                responseContent = "I'm not sure how to handle that yet. Try 'go to wishlist' or 'dark mode'."
            }

            const assistantMessage: Message = {
                id: Math.random().toString(36).slice(2) + Date.now().toString(36),
                role: 'assistant',
                content: responseContent,
                products: responseProducts
            }

            setMessages(prev => [...prev, assistantMessage])
            if (sessionId) {
                await saveMessage(sessionId, 'assistant', assistantMessage.content)
                await supabase.from('copilot_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId)
            }

        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: Math.random().toString(36).slice(2) + Date.now().toString(36),
                role: 'assistant',
                content: `Error: ${error.message || 'Something went wrong.'}`,
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        await handleSubmitWithMessage(input)
    }

    const renderMessage = (content: string) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>')
    }

    // Greeting based on time of day
    const getGreeting = () => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
            <SheetContent
                side="right"
                hideOverlay={true}
                className="w-full sm:w-[440px] p-0 flex flex-col border-l-0 sm:border-l border-gray-200 dark:border-zinc-800 shadow-2xl h-[100dvh] bg-gray-50 dark:bg-zinc-950"
                onInteractOutside={(e: any) => e.preventDefault()}
            >
                {/* ── Header ── */}
                <SheetHeader className="p-0 space-y-0 border-b border-gray-200/60 dark:border-zinc-800">
                    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <SheetTitle className="text-base font-bold text-white leading-none">Style AI</SheetTitle>
                                    <p className="text-xs text-amber-100 mt-0.5 flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                                        Online • Your personal stylist
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setShowHistory(!showHistory)} title="History">
                                    <History className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10" onClick={startNewChat} title="New Chat">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                {/* ── History Panel ── */}
                {showHistory && (
                    <div className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 max-h-52 overflow-auto">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2 px-1">Recent Conversations</p>
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => loadSession(session.id)}
                                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-sm mb-1 ${currentSessionId === session.id
                                    ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
                                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <MessageSquare className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                    <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{session.title}</span>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e: React.MouseEvent) => deleteSession(session.id, e)}
                                >
                                    <Trash2 className="h-3 w-3 text-gray-400" />
                                </Button>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">No conversations yet</p>
                        )}
                    </div>
                )}

                {/* ── Messages Area ── */}
                <div className="flex-1 px-4 py-4 overflow-y-auto" ref={scrollRef}>
                    {messages.length === 0 ? (
                        /* ── Empty State / Welcome ── */
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="text-center mb-8 space-y-2">
                                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-4">
                                    <Sparkles className="h-7 w-7 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {getGreeting()} ✨
                                </h3>
                                <p className="text-sm text-gray-500 max-w-[260px] mx-auto leading-relaxed">
                                    I can help you find the perfect outfit, track orders, or style your look.
                                </p>
                            </div>

                            {/* Quick Actions as Chips */}
                            <div className="w-full space-y-2">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-1">Try asking</p>
                                <div className="flex flex-wrap gap-2">
                                    {customerActions.map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setInput(action.prompt)
                                                // Auto submit
                                                setTimeout(() => handleSubmitWithMessage(action.prompt), 50)
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all active:scale-95"
                                        >
                                            <action.icon className="h-3 w-3 text-amber-600" />
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── Chat Messages ── */
                        <div className="space-y-4">
                            {messages.map((message, idx) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                                            <Sparkles className="h-3.5 w-3.5 text-white" />
                                        </div>
                                    )}
                                    <div className="max-w-[80%] space-y-2">
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${message.role === 'user'
                                                ? 'bg-amber-600 text-white rounded-tr-sm'
                                                : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm border border-gray-100 dark:border-zinc-800'
                                                }`}
                                        >
                                            <div
                                                className="whitespace-pre-wrap"
                                                dangerouslySetInnerHTML={{ __html: renderMessage(message.content) }}
                                            />
                                        </div>

                                        {/* Product Cards */}
                                        {message.products && message.products.length > 0 && (
                                            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x -mx-1 px-1">
                                                {message.products.map((prod: any) => (
                                                    <a
                                                        key={prod.id}
                                                        href={`/product/${prod.id}`}
                                                        className="min-w-[130px] w-[130px] bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-zinc-800 snap-start hover:shadow-md transition-shadow group"
                                                    >
                                                        <div className="aspect-[3/4] bg-gray-100 dark:bg-zinc-800 overflow-hidden relative">
                                                            <Image
                                                                src={(typeof prod.images?.[0] === 'string' ? (typeof prod.images?.[0] === 'string' ? prod.images[0] : (prod.images?.[0] as any)?.src) : (prod.images?.[0] as any)?.src) || '/placeholder.jpg'}
                                                                alt={prod.name}
                                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                                fill
                                                                sizes="130px"
                                                            />
                                                        </div>
                                                        <div className="p-2">
                                                            <p className="text-[11px] font-medium text-gray-900 dark:text-gray-200 truncate">{prod.name}</p>
                                                            <p className="text-[11px] font-bold text-amber-600">₹{prod.price?.toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {message.role === 'user' && (
                                        <div className="h-7 w-7 rounded-xl bg-gray-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <User className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isLoading && (
                                <div className="flex gap-2.5 justify-start">
                                    <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                                        <Sparkles className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-1">
                                            <span className="h-2 w-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="h-2 w-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="h-2 w-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Input Bar ── */}
                <div className="p-3 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
                    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Input
                                value={input}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                                placeholder="Ask me anything about fashion..."
                                className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 h-11 text-sm bg-gray-50 dark:bg-zinc-800 focus-visible:ring-1 focus-visible:ring-amber-500 focus-visible:border-amber-500 placeholder:text-gray-400"
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            type="submit"
                            size="icon"
                            className="h-11 w-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 transition-all active:scale-90 disabled:opacity-40"
                            disabled={isLoading || !input.trim()}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                    <p className="text-[10px] text-center text-gray-400 mt-2">
                        Style AI by FitMirror • May make mistakes
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// Navbar trigger button
export function GenieNavButton() {
    const { setOpen } = useGenie()

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="hover:bg-muted relative gap-2 hidden md:flex"
                onClick={() => setOpen(true)}
            >
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span className="font-medium text-indigo-700">AI Stylist</span>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="hover:bg-muted relative md:hidden"
                onClick={() => setOpen(true)}
            >
                <Sparkles className="h-5 w-5 text-indigo-600" />
            </Button>
        </>
    )
}

// Context trigger button (Small shortcut)
interface GenieContextTriggerProps {
    prompt: string
    context: any
    label?: string
    className?: string
    icon?: LucideIcon
}

export function GenieContextTrigger({ prompt, context, label = "Ask Genie", className, icon: Icon = Sparkles }: GenieContextTriggerProps) {
    const { sendMessage } = useGenie()

    return (
        <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 h-7 text-xs font-medium border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 ${className}`}
            onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                sendMessage(prompt, context)
            }}
        >
            <Icon className="h-3 w-3" />
            {label}
        </Button>
    )
}
