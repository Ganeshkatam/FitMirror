import Link from 'next/link'
import { Sparkles, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

import { MobileBottomBar } from '@/components/layout/mobile-bottom-bar'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CompareTray } from '@/components/compare/compare-tray'

export const dynamic = 'force-dynamic'

export default async function ShopLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: storeSettings } = await supabase.from('store_settings').select('*').single()

    // Store Closed Logic
    if (storeSettings?.store_open === false) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <header className="sticky top-0 z-50 w-full border-b glass">
                    <div className="w-full max-w-[1800px] mx-auto px-4 md:px-6 flex h-16 items-center">
                        <Link href="/" className="mr-8 flex items-center space-x-2">
                            <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xl font-serif font-bold tracking-tight">
                                FitMirror
                            </span>
                        </Link>
                        <div className="ml-auto flex items-center gap-4">
                            <Link href="/login">
                                <Button variant="ghost">Login</Button>
                            </Link>
                        </div>
                    </div>
                </header>
                <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center animate-pulse">
                        <Lock className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h1 className="text-3xl font-serif font-bold">Store is Currently Closed</h1>
                        <p className="text-muted-foreground text-lg">
                            {storeSettings.pause_message || "We are currently restocking and improving our experience. Please check back soon!"}
                        </p>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <SiteFooter />
            <MobileBottomBar />
            <CompareTray />
        </div>
    )
}
