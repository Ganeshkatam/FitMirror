import { verifyDeletionToken, confirmDeletion } from '@/lib/actions/settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ConfirmDeletionPage({
    searchParams,
}: {
    searchParams: { token?: string }
}) {
    const token = searchParams.token

    if (!token) {
        return (
            <div className="container max-w-md mx-auto py-20">
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" /> Invalid Link
                        </CardTitle>
                        <CardDescription>
                            This deletion link is missing a token. Please request a new one from your settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/account/settings">
                            <Button variant="outline" className="w-full">Return to Settings</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Verify token on the server
    const verification = await verifyDeletionToken(token)

    if (verification.error) {
        return (
            <div className="container max-w-md mx-auto py-20">
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" /> Link Expired or Invalid
                        </CardTitle>
                        <CardDescription>
                            {verification.error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/account/settings">
                            <Button variant="outline" className="w-full">Return to Settings</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // If valid, show confirmation form (Server Action in form)
    return (
        <div className="container max-w-md mx-auto py-20">
            <Card className="border-red-500 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-6 w-6" /> Final Confirmation
                    </CardTitle>
                    <CardDescription>
                        You are about to permanently delete your account. This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg text-sm text-red-800 space-y-2">
                        <p><strong>Warning:</strong> All data will be wiped immediately:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Profile and settings</li>
                            <li>Order history and invoices</li>
                            <li>Wishlists and saved items</li>
                            <li>Personal measurements</li>
                        </ul>
                    </div>

                    <form action={async () => {
                        'use server'
                        const result = await confirmDeletion(token)
                        if (result.success) {
                            redirect('/')
                        } else {
                            // In a real app we'd handle error UI better, 
                            // but for now redirecting to error page or showing distinct error is hard from server action in server component without client component wrap.
                            // We'll rely on the action succeeding if verify passed.
                            redirect('/account/delete/error?msg=' + encodeURIComponent(result.error || 'Unknown error'))
                        }
                    }}>
                        <Button variant="destructive" className="w-full font-bold" type="submit">
                            Yes, Permanently Delete My Account
                        </Button>
                    </form>

                    <Link href="/account/settings">
                        <Button variant="ghost" className="w-full">Cancel and Keep Account</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
