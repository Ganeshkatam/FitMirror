'use client'

import { useState, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface VoiceSearchButtonProps {
    onResult: (transcript: string) => void
    className?: string
}

export function VoiceSearchButton({ onResult, className }: VoiceSearchButtonProps) {
    const [isListening, setIsListening] = useState(false)
    const [isSupported, setIsSupported] = useState(false)

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setIsSupported(true)
        }
    }, [])

    const startListening = () => {
        if (!isSupported) {
            toast.error("Voice search is not supported in this browser.")
            return
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.lang = 'en-US'
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            onResult(transcript)
            setIsListening(false)
        }

        recognition.onerror = (event: any) => {
            console.error(event.error)
            setIsListening(false)
            if (event.error === 'not-allowed') {
                toast.error("Microphone access denied.")
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.start()
    }

    if (!isSupported) return null

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn("text-muted-foreground hover:text-foreground hover:bg-transparent", className)}
            onClick={startListening}
            title="Search by voice"
        >
            {isListening ? (
                <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                </span>
            ) : (
                <Mic className="h-5 w-5" />
            )}
        </Button>
    )
}
