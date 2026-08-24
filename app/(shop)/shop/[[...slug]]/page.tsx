import { ShopClient } from '../shop-client'
import { Metadata } from 'next'

import { StorefrontService } from '@/lib/service/storefront'

interface PageProps {
    params: Promise<{
        slug?: string[]
    }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const p = await params
    const slug = p.slug || []

    if (slug.length === 0) {
        return {
            title: 'Shop | FitMirror',
            description: 'Browse all products on FitMirror'
        }
    }

    // Capitalize slug for title
    const title = slug.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' - ')
    return {
        title: `${title} | FitMirror`,
        description: `Shop for ${title} on FitMirror`
    }
}

export default async function ShopPage({ params, searchParams }: PageProps) {
    const p = await params
    const sp = await searchParams

    // Construct Payload for Server-Side Search
    const q = (sp.q as string) || ''
    const urlCategory = sp.category as string
    const safeSlugString = p.slug ? p.slug.join(',') : ''

    // Logic to merge categories (replicated from client)
    const cats = urlCategory ? urlCategory.split(',') : []
    const currentSlug = safeSlugString ? safeSlugString.split(',') : []
    if (currentSlug.length > 0) {
        currentSlug.forEach(s => {
            if (!cats.includes(s)) cats.push(s)
        })
    }
    const effectiveCategories = cats

    const payload = {
        query: q,
        filters: {
            category: effectiveCategories.length > 0 ? effectiveCategories : undefined,
            gender: typeof sp.gender === 'string' ? sp.gender.split(',').filter(Boolean) : undefined,
            size: typeof sp.size === 'string' ? sp.size.split(',').filter(Boolean) : undefined,
            color: typeof sp.color === 'string' ? sp.color.split(',').filter(Boolean) : undefined,
            brand: typeof sp.brand === 'string' ? sp.brand.split(',').filter(Boolean) : undefined,
            minPrice: sp.minPrice as string,
            maxPrice: sp.maxPrice as string,
            discount: sp.discount as string,
            pattern: typeof sp.pattern === 'string' ? sp.pattern.split(',').filter(Boolean) : undefined,
            occasion: typeof sp.occasion === 'string' ? sp.occasion.split(',').filter(Boolean) : undefined,
            sleeve: typeof sp.sleeve === 'string' ? sp.sleeve.split(',').filter(Boolean) : undefined,
            neck: typeof sp.neck === 'string' ? sp.neck.split(',').filter(Boolean) : undefined,
            fit: typeof sp.fit === 'string' ? sp.fit.split(',').filter(Boolean) : undefined,
            material: typeof sp.material === 'string' ? sp.material.split(',').filter(Boolean) : undefined,
            rating: sp.rating as string,
            inStock: sp.inStock as string,
            age: typeof sp.age === 'string' ? sp.age.split(',').filter(Boolean) : undefined,
        },
        sort: (sp.sort as string) || 'recommended',
    }

    // Server-side Fetch
    const { results, meta } = await StorefrontService.searchProducts(payload)
    const allCategories = await StorefrontService.getAllCategories()

    return (
        <ShopClient
            slug={p.slug}
            initialProducts={results}
            initialFacets={meta?.facets}
            allCategories={allCategories}
        />
    )
}
