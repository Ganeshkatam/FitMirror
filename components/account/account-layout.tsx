'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
} from 'lucide-react'

interface AccountLayoutProps {
    children: React.ReactNode
    title: string
    description?: string
}

export function AccountLayout({ children, title, description }: AccountLayoutProps) {
    const router = useRouter()

    return (
        <div className="container max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                    <h1 className="text-2xl font-serif font-bold text-gray-900 truncate">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground text-sm truncate">{description}</p>
                    )}
                </div>
            </div>

            {/* Main Layout: Full width content */}
            <div className="min-w-0">
                {children}
            </div>
        </div>
    )
}
