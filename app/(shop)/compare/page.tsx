import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check, X, ArrowLeft } from 'lucide-react'

// --- Data Fetching ---
async function getComparisonProducts(ids: string[]) {
    if (ids.length === 0) return []
    const supabase = await createClient()
    const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', ids)

    return data || []
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
    const ids = (await searchParams).ids?.split(',').filter(Boolean) || []

    if (ids.length < 2) {
        // Ideally redirect or show empty state, but for now lets just show what we have or message
    }

    const products = await getComparisonProducts(ids)

    // Sort products by the order of IDs in URL to maintain consistency?
    // Or just render as returned.

    const attributes = [
        { label: 'Price', key: 'price', format: (v: any) => `₹${v?.toLocaleString('en-IN')}` },
        { label: 'Brand', key: 'brand' },
        { label: 'Category', key: 'category' },
        { label: 'Material', key: 'material' },
        { label: 'Pattern', key: 'pattern' },
        { label: 'Fit', key: 'fit' },
        { label: 'Sleeve', key: 'sleeve_length' },
        { label: 'Neck', key: 'neck_type' },
        { label: 'Occasion', key: 'occasion' },
        { label: 'Rating', key: 'rating', format: (v: any) => v ? `${v}/5` : '-' },
    ]

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1920px] mx-auto px-4 md:px-8 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/shop">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Shop
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-serif font-bold">Compare Products</h1>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        No products found to compare.
                    </div>
                ) : (
                    <div className="overflow-x-auto pb-10">
                        <table className="w-full min-w-[300px] border-collapse">
                            <thead>
                                <tr>
                                    <th className="w-32 bg-gray-50 p-4 text-left border-b border-r text-sm font-semibold text-gray-600 sticky left-0 z-10">
                                        Product
                                    </th>
                                    {products.map(product => (
                                        <th key={product.id} className="min-w-[240px] p-4 border-b border-r align-top bg-white">
                                            <div className="space-y-3">
                                                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                                                    <Image
                                                        src={product.images?.[0] || product.image || '/placeholder.png'}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="text-left space-y-1">
                                                    <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[40px]">
                                                        {product.name}
                                                    </h3>
                                                    <div className="font-bold text-lg">
                                                        ₹{product.price.toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <Link href={`/product/${product.id}`} className="block w-full">
                                                    <Button variant="outline" className="w-full text-xs font-bold uppercase">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {attributes.map(attr => (
                                    <tr key={attr.key} className="hover:bg-gray-50 transition-colors">
                                        <td className="w-32 bg-gray-50/50 p-4 text-sm font-medium text-gray-500 border-b border-r sticky left-0 z-10 backdrop-blur-sm">
                                            {attr.label}
                                        </td>
                                        {products.map(product => {
                                            const val = product[attr.key as keyof typeof product]
                                            return (
                                                <td key={`${product.id}-${attr.key}`} className="p-4 border-b border-r text-sm text-gray-900 text-center font-medium bg-white">
                                                    {val ? (attr.format ? attr.format(val) : val) : <span className="text-gray-300">-</span>}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
