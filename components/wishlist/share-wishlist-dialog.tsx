'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Share2, Copy, Check, Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { createWishlistShare, toggleWishlistVisibility, getShareStatus } from '@/lib/actions/wishlist'

export function ShareWishlistDialog() {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [shareCode, setShareCode] = React.useState<string | null>(null)
    const [isPublic, setIsPublic] = React.useState(true)
    const [copied, setCopied] = React.useState(false)

    React.useEffect(() => {
        if (open) {
            loadShareStatus()
        }
    }, [open])

    async function loadShareStatus() {
        setLoading(true)
        const status = await getShareStatus()
        if (status.exists) {
            setShareCode(status.shareCode)
            setIsPublic(status.isPublic)
        }
        setLoading(false)
    }

    async function handleCreateShare() {
        setLoading(true)
        const result = await createWishlistShare()
        if (result.error) {
            toast.error(result.error)
        } else if (result.shareCode) {
            setShareCode(result.shareCode)
            toast.success('Share link created!')
        }
        setLoading(false)
    }

    async function handleToggleVisibility() {
        const result = await toggleWishlistVisibility()
        if (result.error) {
            toast.error(result.error)
        } else {
            setIsPublic(result.isPublic!)
            toast.success(result.isPublic ? 'Wishlist is now public' : 'Wishlist is now private')
        }
    }

    function copyToClipboard() {
        if (!shareCode) return
        const url = `${window.location.origin}/wishlist/${shareCode}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        toast.success('Link copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    const shareUrl = shareCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/wishlist/${shareCode}` : ''

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Wishlist
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Your Wishlist</DialogTitle>
                    <DialogDescription>
                        Create a shareable link to let friends see your curated collection.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : shareCode ? (
                        <>
                            {/* Visibility Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                                <div className="flex items-center gap-3">
                                    {isPublic ? (
                                        <Globe className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Lock className="h-5 w-5 text-amber-600" />
                                    )}
                                    <div>
                                        <Label className="font-medium">
                                            {isPublic ? 'Public' : 'Private'}
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {isPublic
                                                ? 'Anyone with the link can view'
                                                : 'Only you can view'}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isPublic}
                                    onCheckedChange={handleToggleVisibility}
                                />
                            </div>

                            {/* Share Link */}
                            <div className="space-y-2">
                                <Label>Your share link</Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={shareUrl}
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6 space-y-4">
                            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                <Share2 className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-muted-foreground">
                                Generate a unique link to share your wishlist with friends and family.
                            </p>
                            <Button onClick={handleCreateShare}>
                                Create Share Link
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
