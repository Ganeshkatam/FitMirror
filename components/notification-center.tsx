'use client'

import * as React from 'react'
import { Bell, AlertCircle, Package, ShoppingBag, Sparkles, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Notification {
    id: string
    type: 'order' | 'product' | 'system' | 'promotion'
    title: string
    message: string | null
    link: string | null
    created_at: string
    is_read: boolean
}

export function NotificationCenter() {
    const [notifications, setNotifications] = React.useState<Notification[]>([])
    const [open, setOpen] = React.useState(false)
    const [unreadCount, setUnreadCount] = React.useState(0)
    const supabase = createClient()
    const router = useRouter()

    React.useEffect(() => {
        let channel: any

        async function init() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch initial
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20)

            if (data) {
                const notifications = data.map(n => ({
                    ...n,
                    created_at: n.created_at, // ensure string
                    // Ensure type is one of the union types or fallback
                    type: (['order', 'product', 'system', 'promotion'].includes(n.type) ? n.type : 'system') as Notification['type']
                })) as Notification[]
                setNotifications(notifications)
                setUnreadCount(notifications.filter(n => !n.is_read).length)
            }

            // Realtime
            channel = supabase.channel('user-notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const newNotif = payload.new as Notification
                        setNotifications(prev => [newNotif, ...prev])
                        setUnreadCount(prev => prev + 1)
                    }
                )
                .subscribe()
        }

        init()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const markAsRead = async (id: string, link: string | null) => {
        // Optimistic
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await supabase.from('notifications').update({ is_read: true }).eq('id', id)

        if (link) {
            setOpen(false)
            router.push(link)
        }
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
        }
    }

    function getIcon(type: string) {
        switch (type) {
            case 'order': return <ShoppingBag className="h-4 w-4" />
            case 'product': return <Package className="h-4 w-4" />
            case 'promotion': return <Sparkles className="h-4 w-4" />
            case 'system': return <AlertCircle className="h-4 w-4" />
            default: return <Info className="h-4 w-4" />
        }
    }

    function getColor(type: string) {
        switch (type) {
            case 'order': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
            case 'promotion': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
            case 'system': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800'
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted transition-all">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm">Notifications</h3>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs hover:text-primary" onClick={markAllAsRead}>
                            Mark all read
                        </Button>
                    )}
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Bell className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-foreground">No notifications</p>
                            <p className="text-xs text-muted-foreground mt-1">We&apos;ll notify you when important updates arrive.</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors relative group",
                                    !notification.is_read && "bg-amber-50/40 dark:bg-amber-950/10"
                                )}
                                onClick={() => markAsRead(notification.id, notification.link)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", getColor(notification.type))}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={cn("text-sm font-medium leading-none", !notification.is_read && "text-primary")}>
                                                {notification.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
