'use client'

import * as React from 'react'
import { Tag, CreditCard, Percent, Copy, Check } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Offer {
    id: string
    title: string
    description: string | null
    code?: string | null // Make optional and nullable to match DB
    discount_type: 'percentage' | 'fixed' // Update type to match DB
    discount_value?: number // Add if needed for display
}

interface BestOffersProps {
    offers: any[] // Using any for now to avoid strict type mismatch with raw DB response if needed, or better:
    // offers: Database['public']['Tables']['coupons']['Row'][]
}

export function BestOffers({ offers }: BestOffersProps) {
    const [copiedId, setCopiedId] = React.useState<string | null>(null)

    const copyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code)
        setCopiedId(id)
        toast.success("Coupon code copied!")
        setTimeout(() => setCopiedId(null), 2000)
    }

    // Early return AFTER hooks
    if (!offers || offers.length === 0) return null

    return (
        <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Best Offers
            </h3>

            <div className="space-y-3">
                {offers.slice(0, 3).map((offer) => (
                    <div key={offer.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5"><Tag className="h-4 w-4 text-green-600" /></div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-800">{offer.title}</p>
                            <p className="text-gray-500 text-xs">{offer.description}</p>
                            {offer.code && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded border border-dashed border-gray-300">
                                        {offer.code}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <button className="text-primary text-sm font-medium hover:underline w-full text-left">
                        View all {offers.length} offers →
                    </button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Available Offers</DialogTitle>
                        <DialogDescription>
                            Apply these coupons at checkout to get discounts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {offers.map((offer) => (
                            <div key={offer.id} className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                <div className="mt-1 p-2 bg-background rounded-full border shadow-sm">
                                    <Tag className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm">{offer.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">{offer.description}</p>

                                    {offer.code ? (
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className="text-xs font-mono font-medium bg-secondary px-3 py-1.5 rounded-md border border-dashed border-primary/20 text-primary">
                                                {offer.code}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2"
                                                onClick={() => copyCode(offer.code!, offer.id)}
                                            >
                                                {copiedId === offer.id ? (
                                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                                <span className="sr-only">Copy code</span>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                                            Auto-applied at checkout
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
