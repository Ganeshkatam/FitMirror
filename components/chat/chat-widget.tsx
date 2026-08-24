'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { ChatWindow } from './chat-window'
import { startConversation } from '@/app/actions/chat'
import { toast } from "sonner"

interface ChatWidgetProps {
    storeId: string
    userId?: string
}

export function ChatWidget({ storeId, userId }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleOpen = async () => {
        if (!userId) {
            window.location.href = '/login'
            return
        }

        if (conversationId) {
            setIsOpen(true)
            return
        }

        setLoading(true)
        try {
            const id = await startConversation(storeId)
            setConversationId(id)
            setIsOpen(true)
        } catch (error) {
            toast.error("Could not start chat. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button onClick={handleOpen} disabled={loading} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat with Seller
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                    {conversationId && userId && (
                        <ChatWindow
                            conversationId={conversationId}
                            userId={userId}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
