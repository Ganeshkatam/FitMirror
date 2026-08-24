'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface CopyButtonProps {
    value: string
}

export function CopyButton({ value }: CopyButtonProps) {
    const [hasCopied, setHasCopied] = React.useState(false)

    React.useEffect(() => {
        setTimeout(() => {
            setHasCopied(false)
        }, 2000)
    }, [hasCopied])

    return (
        <Button
            size="icon"
            variant="outline"
            className="shrink-0"
            onClick={() => {
                navigator.clipboard.writeText(value)
                setHasCopied(true)
                toast.success('Copied to clipboard!')
            }}
        >
            {hasCopied ? (
                <Check className="h-4 w-4" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
            <span className="sr-only">Copy</span>
        </Button>
    )
}
