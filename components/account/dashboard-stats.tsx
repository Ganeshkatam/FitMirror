import { Package, Heart, Zap, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface DashboardStatsProps {
    orderCount: number
    wishlistCount: number
    points?: number
    styleScore?: number
}

export function DashboardStats({ orderCount, wishlistCount, points = 0, styleScore = 0 }: DashboardStatsProps) {
    const stats = [
        {
            label: "Total Orders",
            value: orderCount.toString(),
            icon: Package,
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            label: "Wishlist",
            value: wishlistCount.toString(),
            icon: Heart,
            color: "text-rose-500",
            bg: "bg-rose-50"
        },
        {
            label: "Points",
            value: points.toLocaleString(),
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-50"
        },
        {
            label: "Style Score",
            value: `${styleScore}%`,
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        }
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className="border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
