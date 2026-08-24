'use client'

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { joinWaitlist } from "@/app/actions/inventory"
import { toast } from "sonner"

interface WaitlistButtonProps {
    productId: string
    size: string
    isOutOfStock: boolean
    children: React.ReactNode // The "Add to Cart" button usually
}

export function WaitlistButton({ productId, size, isOutOfStock, children }: WaitlistButtonProps) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [joined, setJoined] = useState(false)

    // Strict Auth Check for Waitlist
    const handleOpenChange = async (newOpen: boolean) => {
        if (newOpen) {
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("Please login to join waitlist", {
                    action: {
                        label: "Login",
                        onClick: () => window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname)
                    }
                })
                setTimeout(() => window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname), 1500)
                return
            }
        }
        setOpen(newOpen)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await joinWaitlist(productId, size, email)
            setJoined(true)
            toast.success("You're on the list!", {
                description: "We'll notify you when this item is back in stock."
            })
            setTimeout(() => setOpen(false), 2000)
        } catch (error) {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    // Render children directly if in stock
    if (!isOutOfStock) {
        return <>{children}</>
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="w-full gap-2">
                    <Bell className="h-4 w-4" />
                    Notify Me
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join the Waitlist</DialogTitle>
                    <DialogDescription>
                        Enter your email to be notified when this item is back in stock.
                    </DialogDescription>
                </DialogHeader>
                {!joined ? (
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Joining..." : "Notify Me"}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="py-6 text-center text-muted-foreground">
                        <div className="flex justify-center mb-2">
                            <Bell className="h-12 w-12 text-green-500" />
                        </div>
                        <p className="text-lg font-medium text-foreground">You&apos;re all set!</p>
                        <p>We&apos;ll email you as soon as stock arrives.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
