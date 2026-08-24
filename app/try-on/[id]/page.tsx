
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { StorefrontService } from '@/lib/service/storefront'
import { TryOnClient } from './try-on-client'

interface Props {
    params: {
        id: string
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const product = await StorefrontService.getProductById(params.id)
    if (!product) return { title: 'Product Not Found' }

    return {
        title: `Try On ${product.name} | FitMirror Virtual Room`,
        description: `See how ${product.name} looks on you with our Virtual Fitting Room.`
    }
}

export default async function TryOnProductPage({ params }: Props) {
    const product = await StorefrontService.getProductById(params.id)

    if (!product) {
        notFound()
    }

    return <TryOnClient product={product} />
}
