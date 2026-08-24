import { Button } from '@/components/ui/button'
import { Gift, Copy } from 'lucide-react'
import { ReferralShare } from '@/components/account/referral-share'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountLayout } from '@/components/account/account-layout'

export default async function ReferralsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Basic referral code generation
    const referralCode = `FIT${user.id.substring(0, 6).toUpperCase()}`

    return (
        <AccountLayout title="Referrals" description="Invite friends and earn rewards">
            <Card className="mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gift className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Give ₹500, Get ₹500</h2>
                    <p className="text-indigo-100 mb-6 max-w-sm mx-auto text-sm">
                        Share your unique referral code with friends. When they make their first purchase, you both get ₹500 off.
                    </p>

                    <ReferralShare code={referralCode} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Referrals</CardTitle>
                    <CardDescription>People who have used your code.</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8 text-muted-foreground">
                    <p>No referrals yet. Start sharing!</p>
                </CardContent>
            </Card>
        </AccountLayout>
    )
}
