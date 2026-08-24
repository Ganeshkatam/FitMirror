import { MetadataRoute } from 'next'
import { StorefrontService } from '@/lib/service/storefront'
import { getCategoriesWithSubs } from '@/lib/categories/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://fitmirror.in'

    // 1. Static Routes
    const routes = [
        '',
        '/shop',
        '/expert-advice',
        '/virtual-try-on',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }))

    // 2. Fetch Dynamic Data
    let productRoutes: MetadataRoute.Sitemap = []
    let categoryRoutes: MetadataRoute.Sitemap = []

    try {
        const products = await StorefrontService.getAllProductsForSitemap()
        productRoutes = products.map((product) => ({
            url: `${baseUrl}/product/${product.id}`,
            lastModified: product.updated_at,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }))
    } catch (e) {
        console.error('Sitemap: failed to fetch products', e)
    }

    try {
        const categories = await getCategoriesWithSubs()
        categoryRoutes = categories.map((cat) => ({
            url: `${baseUrl}/shop?category=${encodeURIComponent(cat.slug)}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))
    } catch (e) {
        console.error('Sitemap: failed to fetch categories', e)
    }

    return [...routes, ...categoryRoutes, ...productRoutes]
}
