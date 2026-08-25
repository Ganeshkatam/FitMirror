import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { createClient } from '@/lib/supabase/server';
import { PricingRepository } from '@/lib/domain/pricing/repository';
import { calculateOrderTotals } from '@/lib/domain/pricing/calculator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items, address, couponCode, shippingMethod, paymentMethod, idempotencyKey } = body;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
        }
        
        if (!idempotencyKey) {
            return NextResponse.json({ error: 'Missing idempotencyKey' }, { status: 400 });
        }

        // 1. Check Idempotency - does the order already exist?
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('id, total_amount, currency, status')
            .eq('idempotency_key', idempotencyKey)
            .eq('user_id', user.id)
            .single();

        let dbOrderId: string;
        let amountPaise: number;
        let currency: string;

        if (existingOrder) {
            // Order already created in DB, reuse it
            dbOrderId = existingOrder.id;
            amountPaise = Number(existingOrder.total_amount);
            currency = existingOrder.currency;
            
            // If it's already paid or cancelled, we shouldn't attempt to pay it again
            if (existingOrder.status !== 'pending_payment' && existingOrder.status !== 'placed') {
                return NextResponse.json({ error: `Order is in invalid state for payment: ${existingOrder.status}` }, { status: 400 });
            }
        } else {
            // 2. Prepare Intent Payload
            const linesPayload = items.map((i: any) => ({
                productId: i.product_id,
                offerId: i.offer_id,
                variantId: i.variant_id || null,
                quantity: i.quantity
            }));

            // 3. Execute Atomic DB Transaction via RPC (Computes prices securely)
            const { data: orderId, error: rpcError } = await supabase.rpc('create_order_snapshot', {
                p_user_id: user.id,
                p_coupon_id: couponCode ? null : null, // Handle coupon resolution properly in the future
                p_shipping_method_id: shippingMethod ? null : null, 
                p_address_id: address.id || null,
                p_shipping_address: address,
                p_payment_method: paymentMethod || 'razorpay',
                p_idempotency_key: idempotencyKey,
                p_lines: linesPayload
            });

            if (rpcError || !orderId) {
                console.error("RPC Error:", rpcError);
                throw new Error(rpcError?.message || 'Failed to create order transactionally');
            }

            // Fetch the securely calculated totals from the DB
            const { data: createdOrder, error: fetchError } = await supabase
                .from('orders')
                .select('total_amount, currency')
                .eq('id', orderId)
                .single();
                
            if (fetchError || !createdOrder) {
                throw new Error('Failed to fetch created order totals');
            }

            dbOrderId = orderId;
            amountPaise = Number(createdOrder.total_amount);
            currency = createdOrder.currency || 'INR';
        }

        // 5. Razorpay Integration
        if (paymentMethod === 'cod') {
            // For COD, order is considered placed immediately. Transition status to placed.
            const { error: transitionError } = await supabase.rpc('transition_order_status', {
                p_order_id: dbOrderId,
                p_expected_state: 'pending_payment',
                p_next_state: 'placed'
            });
            if (transitionError) throw transitionError;

            return NextResponse.json({
                status: 'success',
                orderData: { db_order_ids: [dbOrderId] }
            });
        } else {
            // Create Razorpay Order
            const razorpayOrder = await razorpay.orders.create({
                amount: amountPaise,
                currency: currency,
                receipt: `receipt_${dbOrderId.replace(/-/g, '').substring(0, 30)}`,
                notes: { order_id: dbOrderId }
            });

            return NextResponse.json({
                status: 'success',
                orderData: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    db_order_ids: [dbOrderId]
                }
            });
        }
    } catch (error: any) {
        console.error("Create order failed:", error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
