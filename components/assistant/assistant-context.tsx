"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    action?: {
        type: 'SEARCH' | 'TRY_ON' | 'STYLE_HELP' | 'NAVIGATE' | 'ORDER_TRACKING'
        payload?: any
    }
}

interface AssistantContextType {
    isOpen: boolean
    toggleOpen: () => void
    messages: Message[]
    sendMessage: (text: string) => Promise<void>
    isTyping: boolean
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined)

export function AssistantProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: "Hi! I'm your style assistant. I can help you find products, check your fit, or navigate the store. How can I help? ✨" }
    ])
    const [isTyping, setIsTyping] = useState(false)

    const toggleOpen = () => setIsOpen(prev => !prev)

    const sendMessage = async (text: string) => {
        // Optimistic Update
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
        setMessages(prev => [...prev, userMsg])
        setIsTyping(true)

        try {
            const response = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }) // Context added server-side or via another arg
            })

            const data = await response.json()

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
                action: data.action ? { type: data.action, payload: data.payload } : undefined
            }

            setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "I'm having trouble connecting to my brain right now. Try again later! 🧠" }])
        } finally {
            setIsTyping(false)
        }
    }

    return (
        <AssistantContext.Provider value={{ isOpen, toggleOpen, messages, sendMessage, isTyping }}>
            {children}
        </AssistantContext.Provider>
    )
}

export function useAssistant() {
    const context = useContext(AssistantContext)
    if (context === undefined) {
        throw new Error('useAssistant must be used within an AssistantProvider')
    }
    return context
}
