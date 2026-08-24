'use client'

import { useEffect } from 'react'
import { useLoyalty } from '@/lib/loyalty/use-loyalty'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy, Flame, Coins, Gift, Share2, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

export default function LoyaltyPage() {
    const { points, tier, streak, history, fetchLoyalty, checkIn } = useLoyalty()

    useEffect(() => {
        fetchLoyalty()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const tierColor = {
        'Bronze': 'text-amber-700 bg-amber-100',
        'Silver': 'text-slate-400 bg-slate-100',
        'Gold': 'text-yellow-500 bg-yellow-50',
        'Platinum': 'text-purple-500 bg-purple-50'
    }[tier]

    return (
        <div className="container max-w-4xl py-10 space-y-8">

            {/* Header / Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 to-violet-900 text-white p-8 md:p-12">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-2 ${tierColor}`}>
                            <Crown className="h-4 w-4" /> {tier} Member
                        </div>
                        <h1 className="text-5xl font-extrabold mb-1">{points} <span className="text-2xl font-normal opacity-80">FitCoins</span></h1>
                        <p className="text-violet-200">Next Reward: ₹500 Voucher at 1000 Coins</p>
                    </div>

                    <div className="text-center">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 mb-4">
                            <div className="flex items-center justify-center gap-2 text-orange-400 font-bold text-xl mb-1">
                                <Flame className="h-6 w-6 fill-current" /> {streak} Day Streak
                            </div>
                            <p className="text-xs text-white/60">Check in daily for bonus coins!</p>
                        </div>
                        <Button
                            size="lg"
                            className="w-full bg-orange-500 hover:bg-orange-600 font-bold"
                            onClick={checkIn}
                        >
                            Checking In For Today
                        </Button>
                    </div>
                </div>

                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-violet-500/30 blur-3xl"></div>
            </div>

            {/* Redemption Section */}
            {points >= 100 && (
                <Card className="border-green-100 bg-green-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                            <Gift className="h-5 w-5" /> Redeem Rewards
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-green-800">
                            You have enough points! Redeem <strong>100 FitCoins</strong> for a <strong>₹10 Discount Voucher</strong>.
                        </p>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => useLoyalty.getState().redeemPoints(100)}
                        >
                            Redeem 100 Coins
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Main Grid */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* Ways to Earn */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5 text-yellow-500" /> Ways to Earn
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { title: 'Daily Check-in', points: '+10', icon: '📅' },
                            { title: 'Virtual Try-On', points: '+50', icon: '👗' },
                            { title: 'Write a Review', points: '+20', icon: '⭐' },
                            { title: 'Refer a Friend', points: '+500', icon: '💌' },
                        ].map((way, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{way.icon}</span>
                                    <span className="font-medium">{way.title}</span>
                                </div>
                                <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md text-xs">{way.points}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Refer a Friend */}
                <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-pink-700">
                            <Share2 className="h-5 w-5" /> Viral Referral
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-pink-800">
                            Invite your fashionista friends! They get <span className="font-bold">₹500 off</span> their first order, and you get <span className="font-bold">500 FitCoins</span> when they buy.
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-white border border-pink-200 rounded-lg flex items-center px-3 text-sm text-stone-500 select-all font-mono">
                                FIT-VIKAS-2026
                            </div>
                            <Button className="bg-pink-600 hover:bg-pink-700">Copy</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tier Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" /> Member Privileges
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="relative pt-6 pb-2">
                            <Progress value={33} className="h-3" />
                            <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <span>Bronze</span>
                                <span>Silver</span>
                                <span>Gold</span>
                            </div>
                            {/* Marker */}
                            <div className="absolute top-3 left-[33%] transform -translate-x-1/2">
                                <div className="bg-primary text-white text-[10px] py-0.5 px-2 rounded-full font-bold shadow-lg">
                                    You are here
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="space-y-1">
                                <div className="font-bold text-stone-900">Bronze</div>
                                <div className="text-xs text-muted-foreground">Standard access</div>
                            </div>
                            <div className="space-y-1 opacity-50">
                                <div className="font-bold text-stone-900">Silver</div>
                                <div className="text-xs text-muted-foreground">Free Shipping</div>
                            </div>
                            <div className="space-y-1 opacity-50">
                                <div className="font-bold text-stone-900">Gold</div>
                                <div className="text-xs text-muted-foreground">Early Access</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* History Table */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg">History</h3>
                <div className="border rounded-xl divide-y">
                    {history.map((tx) => (
                        <div key={tx.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-sm">{tx.description}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(tx.created_at), 'MMM d, yyyy')}</p>
                            </div>
                            <span className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.points > 0 ? '+' : ''}{tx.points}
                            </span>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No history yet. Start earning!
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
