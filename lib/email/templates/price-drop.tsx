import * as React from 'react'

interface PriceDropEmailProps {
    productName: string
    productImage: string
    oldPrice: number
    newPrice: number
    productUrl: string
}

export const PriceDropEmail: React.FC<PriceDropEmailProps> = ({
    productName,
    productImage,
    oldPrice,
    newPrice,
    productUrl
}) => (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5', color: '#333', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Price Drop Alert! 📉</h1>
        <p>Good news! An item on your wishlist is now on sale.</p>

        <div style={{ margin: '24px 0', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={productImage}
                alt={productName}
                style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', marginBottom: '16px' }}
            />
            <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>{productName}</h2>
            <div style={{ fontSize: '20px' }}>
                <span style={{ textDecoration: 'line-through', color: '#888', marginRight: '8px' }}>
                    ₹{oldPrice.toLocaleString('en-IN')}
                </span>
                <span style={{ color: '#e11d48', fontWeight: 'bold' }}>
                    ₹{newPrice.toLocaleString('en-IN')}
                </span>
            </div>
        </div>

        <a
            href={productUrl}
            style={{
                display: 'block',
                backgroundColor: '#e11d48',
                color: '#fff',
                textAlign: 'center',
                padding: '16px',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
            }}
        >
            Buy Now
        </a>
    </div>
)
