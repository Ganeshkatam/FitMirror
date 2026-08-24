import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

interface Props {
    searchParams: Promise<{
        error?: string
        error_code?: string
        error_description?: string
    }>
}

export default async function AuthErrorPage({ searchParams }: Props) {
    const params = await searchParams
    const errorDescription = params.error_description?.replace(/\+/g, ' ') || 'An authentication error occurred'

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <CardTitle className="text-2xl">Authentication Error</CardTitle>
                    <CardDescription>{errorDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                        This usually happens when the email link has expired or was already used.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Link href="/signup">
                            <Button className="w-full">Try Signing Up Again</Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" className="w-full">Go to Login</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
