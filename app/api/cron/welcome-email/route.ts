import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { EmailService } from '@/lib/email/service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    // 1. Authorization
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    // 2. Find New Users
    // Logic: Created < 24 hours ago AND email not sent
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .gt('created_at', twentyFourHoursAgo)
        .is('welcome_email_sent_at', null)
        .not('email', 'is', null) // Ensure email exists
        .limit(50) // Batch processing

    if (error) {
        console.error('Failed to fetch new profiles:', error)
        return NextResponse.json({ error: 'Database Error' }, { status: 500 })
    }

    const typedProfiles = profiles as any[]

    if (!typedProfiles || typedProfiles.length === 0) {
        return NextResponse.json({ message: 'No new users found', count: 0 })
    }

    // 3. Process Users
    let emailCount = 0
    const errors: any[] = []

    for (const profile of typedProfiles) {
        try {
            if (!profile.email) continue

            // Send Email
            const result = await EmailService.sendWelcomeEmail(
                profile.email,
                profile.full_name || 'there' // Fallback name
            )

            if (result.success) {
                // Mark as sent
                await supabase
                    .from('profiles')
                    // @ts-ignore
                    .update({ welcome_email_sent_at: new Date().toISOString() })
                    .eq('id', profile.id)

                emailCount++
            } else {
                errors.push({ userId: profile.id, error: result.error })
            }

        } catch (e) {
            console.error(`Error processing user ${profile.id}:`, e)
            errors.push({ userId: profile.id, error: e })
        }
    }

    return NextResponse.json({
        success: true,
        processed: profiles.length,
        sent: emailCount,
        errors
    })
}
