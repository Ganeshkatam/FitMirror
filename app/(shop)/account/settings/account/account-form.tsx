'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/app/actions/update-profile'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner' // Use Sonner directly

interface Profile {
    id: string
    display_name?: string
    phone?: string
    avatar_url?: string
}

interface User {
    id: string
    email?: string
}

export function AccountForm({ user, profile }: { user: User, profile: Profile | null }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        try {
            const result = await updateProfile(formData)

            if (result?.error) {
                toast.error('Error updating profile', {
                    description: result.error,
                })
            } else {
                toast.success('Profile updated', {
                    description: 'Your account details have been saved successfully.',
                })
            }
        } catch (error) {
            toast.error('Something went wrong', {
                description: 'Please try again later.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>
                    This information will be displayed on your profile.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user.email} disabled />
                        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                            id="displayName"
                            name="displayName"
                            defaultValue={profile?.display_name || ''}
                            placeholder="Your name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            name="phone"
                            defaultValue={profile?.phone || ''}
                            placeholder="+91..."
                        />
                    </div>
                    <div className="pt-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
