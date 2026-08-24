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

    // 2. Find Abandoned Carts
    // Logic: Updated > 1 hour ago AND < 24 hours ago AND email not sent
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: carts, error } = await supabase
        .from('carts')
        .select(`
            id,
            user_id,
            updated_at,
            cart_items (
                quantity,
                product:products (
                    name,
                    price,
                    image_url,
                    images,
                    slug
                )
            )
        `)
        .lt('updated_at', oneHourAgo)
        .gt('updated_at', twentyFourHoursAgo)
        .is('abandoned_email_sent_at', null)
        .not('user_id', 'is', null) // Only logged in users
        .limit(50) // Batch processing

    if (error) {
        console.error('Failed to fetch carts:', error)
        return NextResponse.json({ error: 'Database Error' }, { status: 500 })
    }

    const typedCarts = carts as any[] // Explicit cast to avoid type errors with complex joins

    if (!typedCarts || typedCarts.length === 0) {
        return NextResponse.json({ message: 'No abandoned carts found', count: 0 })
    }

    // 3. Process Carts
    let emailCount = 0
    const errors: any[] = []

    for (const cart of typedCarts) {
        try {
            // Get User Email
            const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(cart.user_id)

            if (userError || !user?.email) {
                console.error(`User not found for cart ${cart.id}`, userError)
                continue
            }

            // Format Items for Email
            const emailItems = cart.cart_items.map((item: any) => ({
                name: item.product.name,
                price: item.product.price,
                // Fallback for image
                image: item.product.image_url || (item.product.images ? item.product.images[0] : '') || 'https://fitmirror.app/placeholder.png'
            }))

            if (emailItems.length === 0) continue

            // Send Email
            const result = await EmailService.sendAbandonedCartEmail(
                user.email,
                emailItems,
                `https://fitmirror.app/cart?recovery_id=${cart.id}` // Can implement recovery logic later, just link to cart for now
            )

            if (result.success) {
                // Mark as sent
                await supabase
                    .from('carts')
                    // @ts-ignore
                    .update({ abandoned_email_sent_at: new Date().toISOString() })
                    .eq('id', cart.id)

                emailCount++
            } else {
                errors.push({ cartId: cart.id, error: result.error })
            }

        } catch (e) {
            console.error(`Error processing cart ${cart.id}:`, e)
            errors.push({ cartId: cart.id, error: e })
        }
    }

    return NextResponse.json({
        success: true,
        processed: carts.length,
        sent: emailCount,
        errors
    })
}
