import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function LoginFormSkeleton() {
    return (
        <div className="grid gap-6">
            {/* Tab skeleton */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                <Skeleton className="h-9 rounded-md" />
                <Skeleton className="h-9 rounded-md" />
            </div>
            {/* Method buttons skeleton */}
            <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 flex-1 rounded-md" />
                <Skeleton className="h-9 flex-1 rounded-md" />
            </div>
            {/* Input fields skeleton */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Card glass className="border-0 shadow-xl">
            <CardHeader className="space-y-1 px-4 md:px-6 py-4 md:py-6 pb-2 md:pb-4">
                <CardTitle className="text-xl md:text-3xl font-serif">Welcome Back</CardTitle>
                <CardDescription className="text-sm md:text-base">
                    Sign in to access your account and wardrobe
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                <Suspense fallback={<LoginFormSkeleton />}>
                    <LoginForm />
                </Suspense>
            </CardContent>
        </Card>
    )
}
