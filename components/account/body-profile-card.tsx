'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, User, CheckCircle2 } from 'lucide-react'

export function BodyProfileCard({ hasPhotos }: { hasPhotos: boolean }) {
    if (hasPhotos) {
        return (
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative group">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')] mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-full -mr-16 -mt-16 blur-xl" />

                <CardContent className="p-6 relative z-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg">
                                    <Sparkles className="h-4 w-4 text-amber-300" />
                                </div>
                                <span className="font-semibold text-indigo-100 uppercase tracking-wider text-xs">FitHub Premium</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold mb-1">Your Body Profile</h3>
                            <div className="flex items-center gap-2 text-indigo-100 mb-6">
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                                <span className="text-sm">Active & Ready for Try-On</span>
                            </div>
                        </div>
                        <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                            <User className="h-8 w-8 text-white" />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link href="/shop" className="flex-1">
                            <Button variant="secondary" className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-0 shadow-lg">
                                Try On Clothes
                            </Button>
                        </Link>
                        <Link href="/account/settings/size">
                            <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm">
                                Manage
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden border-dashed border-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 shadow-sm">
                    <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">Setup Body Profile</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                    Upload your photo to unlock Virtual Try-On and see how clothes fit you before you buy.
                </p>
                <Link href="/account/settings/size">
                    <Button className="rounded-full px-8 btn-premium shadow-lg group">
                        <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                        Create Profile
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
