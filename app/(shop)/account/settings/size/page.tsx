import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function SizeSettingsPage() {
    return (
        <div className="container max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">

                <div>
                    <h1 className="text-2xl font-serif font-bold">Body Profile & Sizes</h1>
                    <p className="text-muted-foreground">Manage your measurements for Virtual Try-On</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Measurements</CardTitle>
                    <CardDescription>
                        Update your body measurements to get accurate size recommendations and virtual try-ons.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-500">
                        This feature is currently being enhanced with our new AI sizing engine.
                        Please check back soon for the full measurement dashboard.
                    </p>
                    <Button disabled variant="secondary" className="w-full">
                        AI Measurement Tool (Coming Soon)
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
