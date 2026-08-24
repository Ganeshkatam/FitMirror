import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function PrivacySettingsPage() {
    return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">

                <div>
                    <h1 className="text-2xl font-serif font-bold">Privacy & Security</h1>
                    <p className="text-muted-foreground">Manage your data and privacy preferences</p>
                </div>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Data Sharing</CardTitle>
                    <CardDescription>Control how your data is used for personalization.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Personalized Recommendations</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow us to use your browsing history to recommend products.
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Body Profile Data</Label>
                            <p className="text-sm text-muted-foreground">
                                Store your measurements for Virtual Try-On features.
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your account security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                        Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50">
                        Delete Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
