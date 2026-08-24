import React from 'react'
import { AccountNav } from '@/components/account/account-nav'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
    title: 'My Account | FitMirror',
    description: 'Manage your account, orders, and preferences.',
}

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="bg-stone-50 min-h-screen pb-20">
            {/* Account Header - Hidden on mobile since sub-pages have their own headers via AccountLayout component */}
            <div className="hidden lg:block bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-6 md:py-12">
                    <Link href="/profile" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-3 md:mb-4 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Profile
                    </Link>
                    <h1 className="font-serif text-2xl md:text-4xl text-gray-900">My Account</h1>
                    <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">Manage your personal information and orders.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 md:py-8">
                <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                    {/* Sidebar - visible on desktop, hidden on mobile (hamburger menu covers navigation) */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24 space-y-4">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <AccountNav />
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
