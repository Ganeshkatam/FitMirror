'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { sendMessage } from "@/app/actions/chat"
import { toast } from "sonner"

interface Message {
    id: string
    content: string
    sender_id: string
    created_at: string
}

interface ChatWindowProps {
    conversationId: string
    userId: string
    isStoreView?: boolean // If true, "ME" is the store
}

export function ChatWindow({ conversationId, userId, isStoreView = false }: ChatWindowProps) {
    const supabase = createClient()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    // Load initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (data) setMessages(data)
        }

        fetchMessages()

        // Subscribe to Realtime
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    setMessages(prev => [...prev, newMsg])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, supabase])

    // Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const tempContent = input
        setInput('')

        try {
            await sendMessage(conversationId, tempContent, isStoreView)
        } catch (error) {
            console.error(error)
            toast.error("Failed to send")
            setInput(tempContent) // Restore
        }
    }

    return (
        <div className="flex flex-col h-[500px] border rounded-lg bg-background shadow-sm">
            {/* Header */}
            <div className="p-4 border-b bg-muted/30">
                <h3 className="font-semibold">Chat</h3>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.sender_id === userId
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full",
                                    isMe ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                                        isMe
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                />
                <Button size="icon" onClick={handleSend}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
