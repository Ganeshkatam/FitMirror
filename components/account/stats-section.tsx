'use client'

import { Package, Heart, Zap, TrendingUp, CreditCard, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsSectionProps {
    orderCount: number
    totalSpent: number
    wishlistCount: number
    memberSince: string
    points?: number
    styleScore?: number
}

export function StatsSection({ orderCount, totalSpent, wishlistCount, memberSince, points, styleScore }: StatsSectionProps) {
    const stats = [
        {
            label: "Total Orders",
            value: orderCount,
            icon: Package,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-900/20",
            border: "group-hover:border-blue-200 dark:group-hover:border-blue-900",
        },
        {
            label: "Total Spent",
            value: `₹${totalSpent.toLocaleString('en-IN')}`,
            icon: CreditCard,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            border: "group-hover:border-emerald-200 dark:group-hover:border-emerald-900",
        },
        {
            label: "Wishlist",
            value: wishlistCount,
            icon: Heart,
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-rose-900/20",
            border: "group-hover:border-rose-200 dark:group-hover:border-rose-900",
        },
        {
            label: "Member Since",
            value: memberSince,
            icon: Sparkles,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "group-hover:border-amber-200 dark:group-hover:border-amber-900",
        },
        {
            label: "Points",
            value: (points || 0).toLocaleString(),
            icon: Zap,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            border: "group-hover:border-purple-200 dark:group-hover:border-purple-900",
        },
        {
            label: "Style Score",
            value: (styleScore || 0) + "%",
            icon: TrendingUp,
            color: "text-pink-600 dark:text-pink-400",
            bg: "bg-pink-50 dark:bg-pink-900/20",
            border: "group-hover:border-pink-200 dark:group-hover:border-pink-900",
        },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <Card
                    key={stat.label}
                    className={`border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden ${stat.border}`}
                >
                    <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full relative">
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 w-16 h-16 ${stat.bg} rounded-bl-full -mr-8 -mt-8 opacity-50`} />

                        <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">{stat.label}</p>
                        <p className="text-lg md:text-xl font-bold tracking-tight mt-1">{stat.value}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
