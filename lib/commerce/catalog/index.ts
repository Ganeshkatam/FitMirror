export type ProductStatus = 'active' | 'draft' | 'archived'

export interface ProductVariant {
    id: string
    productId: string
    size: string
    sku: string
    price: number
    compareAtPrice?: number
    inventoryCount: number // Snapshot from inventory engine
}

export interface Product {
    id: string
    title: string
    slug: string
    description: string
    status: ProductStatus
    images: string[]
    variants: ProductVariant[]
    metadata?: Record<string, any>
}

// Pure Logic
export function isProductActive(product: Product): boolean {
    return product.status === 'active'
}

export function getVariant(product: Product, size: string): ProductVariant | undefined {
    return product.variants.find(v => v.size === size)
}
