import { SignupForm } from '@/components/auth/signup-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
    return (
        <Card glass className="border-0 shadow-xl">
            <CardHeader className="space-y-1 px-4 md:px-6 py-4 md:py-6 pb-2 md:pb-4">
                <CardTitle className="text-xl md:text-3xl font-serif">Create Account</CardTitle>
                <CardDescription className="text-sm md:text-base">
                    Join FitMirror and experience virtual try-on shopping
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                <SignupForm />
            </CardContent>
        </Card>
    )
}
