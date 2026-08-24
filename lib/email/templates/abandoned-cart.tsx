import * as React from 'react'

interface AbandonedCartEmailProps {
    items: { name: string; image: string; price: number }[]
    checkoutUrl: string
}

export const AbandonedCartEmail: React.FC<AbandonedCartEmailProps> = ({ items, checkoutUrl }) => (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5', color: '#333', maxWidth: '600px', margin: '0 auto' }}>
        <h1>You left something behind!</h1>
        <p>We saved the items in your cart so you can easily complete your purchase.</p>

        <div style={{ margin: '24px 0', borderTop: '1px solid #eee' }}>
            {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: '1px solid #eee' }}>
                    {item.image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.image} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                        <div>₹{item.price.toLocaleString('en-IN')}</div>
                    </div>
                </div>
            ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="https://fitmirror.in/logo.png"
                alt="FitMirror Logo"
                style={{ maxWidth: '150px' }}
            />
        </div>

        <a
            href={checkoutUrl}
            style={{
                display: 'block',
                backgroundColor: '#000',
                color: '#fff',
                textAlign: 'center',
                padding: '16px',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
            }}
        >
            Complete Checkout
        </a>
    </div>
)
