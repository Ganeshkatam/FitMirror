import * as React from 'react'

interface WelcomeEmailProps {
    firstName: string
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ firstName }) => (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5', color: '#333' }}>
        <h1>Welcome to fitmirror, {firstName}!</h1>
        <p>We&apos;re thrilled to have you here on board. At fitmirror, we believe in helping you find the perfect fit.</p>
        <p>Explore our latest collection and try on clothes virtually using our AI technology.</p>
        <a
            href="https://fitmirror.app/shop"
            style={{
                display: 'inline-block',
                backgroundColor: '#000',
                color: '#fff',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '4px',
                marginTop: '16px'
            }}
        >
            Start Shopping
        </a>
    </div>
)
