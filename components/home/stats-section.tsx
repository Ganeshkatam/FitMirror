'use client'

import { AnimatedCounter } from '@/components/motion/animated-counter'
import { Users, ShoppingBag, Star, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsSectionProps {
    stats?: {
        customers: number
        orders: number
        rating: number
        tryons: number
    }
}

export function StatsSection({ stats }: StatsSectionProps) {
    const data = {
        customers: stats?.customers || 0,
        orders: stats?.orders || 0,
        rating: stats?.rating || 0,
        tryons: stats?.tryons || 0
    }

    const statCards = [
        {
            icon: Users,
            value: data.customers,
            suffix: '+',
            label: 'Community Members',
            subtext: 'Trusting FitMirror',
            color: 'indigo'
        },
        {
            icon: Sparkles,
            value: data.tryons,
            suffix: '+',
            label: 'Virtual Try-Ons',
            subtext: 'AI Realism Generated',
            color: 'purple'
        },
        {
            icon: Star,
            value: data.rating,
            suffix: '/5',
            label: 'Customer Rating',
            subtext: 'From verified reviews',
            color: 'amber',
            decimals: 1
        },
        {
            icon: ShoppingBag,
            value: data.orders,
            suffix: '+',
            label: 'Orders Delivered',
            subtext: 'Across the country',
            color: 'rose'
        }
    ]

    return (
        <section className="w-full py-20 bg-white relative overflow-hidden">
            {/* Background Details */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            <div className="max-w-[1800px] mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                    {statCards.map((stat, i) => (
                        <div
                            key={i}
                            className="group bg-white p-8 md:p-12 hover:bg-gray-50/50 transition-colors duration-500 relative"
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 shadow-sm",
                                stat.color === 'indigo' && "bg-indigo-50 text-indigo-600",
                                stat.color === 'purple' && "bg-purple-50 text-purple-600",
                                stat.color === 'amber' && "bg-amber-50 text-amber-600",
                                stat.color === 'rose' && "bg-rose-50 text-rose-600",
                            )}>
                                <stat.icon className="h-6 w-6" />
                            </div>

                            <div className="space-y-1 relative">
                                <h3 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 tracking-tight">
                                    <AnimatedCounter
                                        end={stat.value}
                                        suffix={stat.suffix}
                                        decimals={stat.decimals || 0}
                                    />
                                </h3>
                                <p className="text-base font-semibold text-gray-900 mt-2">
                                    {stat.label}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {stat.subtext}
                                </p>
                            </div>

                            {/* Hover accent line */}
                            <div className={cn(
                                "absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700 ease-out",
                                stat.color === 'indigo' && "bg-indigo-500",
                                stat.color === 'purple' && "bg-purple-500",
                                stat.color === 'amber' && "bg-amber-500",
                                stat.color === 'rose' && "bg-rose-500",
                            )} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
