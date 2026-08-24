import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getAllNotifications, markAllAsRead } from '@/lib/actions/notifications'
import Link from 'next/link'
import { AccountLayout } from '@/components/account/account-layout'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const notifications = await getAllNotifications()

    return (
        <AccountLayout title="Notifications" description="Stay updated on your orders and activity.">
            <div className="flex justify-end mb-4">
                <form action={markAllAsRead}>
                    <Button variant="outline" size="sm" type="submit">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark all as read
                    </Button>
                </form>
            </div>

            {notifications.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent className="flex flex-col items-center">
                        <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Bell className="h-7 w-7 text-gray-400" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">No Notifications</h2>
                        <p className="text-muted-foreground mb-4">You&apos;re all caught up!</p>
                        <Link href="/shop">
                            <Button>Continue Shopping</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification: any) => (
                        <Card key={notification.id} className={`transition-colors ${notification.is_read ? 'bg-white' : 'bg-blue-50/50 border-blue-100'}`}>
                            <CardContent className="p-4">
                                <Link href={notification.link || '#'} className="block">
                                    <div className="flex items-start gap-4">
                                        <div className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${notification.is_read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <h3 className="font-bold text-sm text-gray-900">{notification.title}</h3>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                            <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                                                {notification.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AccountLayout>
    )
}
