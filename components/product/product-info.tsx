import { Badge } from '@/components/ui/badge'

interface ProductInfoProps {
    product: any
}

export function ProductInfo({ product }: ProductInfoProps) {
    return (
        <div className="space-y-8 pt-8 md:pt-12">

            {/* Description */}
            <div className="space-y-4">
                <h3 className="font-serif text-lg md:text-xl text-gray-900 border-b pb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                    {product.description || 'No description available.'}
                </p>
            </div>

            {/* Product Specifications */}
            <div className="space-y-4">
                <h3 className="font-serif text-lg md:text-xl text-gray-900 border-b pb-2">Product Details</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    {product.brand && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Brand</span> <span className="font-medium text-gray-900">{product.brand}</span></div>
                    )}
                    {product.gender && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Gender</span> <span className="font-medium capitalize text-gray-900">{product.gender}</span></div>
                    )}
                    {product.material && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Material</span> <span className="font-medium capitalize text-gray-900">{product.material}</span></div>
                    )}
                    {product.fit && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Fit</span> <span className="font-medium capitalize text-gray-900">{product.fit}</span></div>
                    )}
                    {product.pattern && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Pattern</span> <span className="font-medium capitalize text-gray-900">{product.pattern}</span></div>
                    )}
                    {product.occasion && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Occasion</span> <span className="font-medium capitalize text-gray-900">{product.occasion}</span></div>
                    )}
                    {product.sleeve_length && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Sleeve</span> <span className="font-medium capitalize text-gray-900">{product.sleeve_length}</span></div>
                    )}
                    {product.neck_type && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Neck</span> <span className="font-medium capitalize text-gray-900">{product.neck_type}</span></div>
                    )}
                    {product.category && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Category</span> <span className="font-medium capitalize text-gray-900">{product.category}</span></div>
                    )}
                    {product.sku && (
                        <div className="border-b border-dashed border-gray-100 pb-1"><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">SKU</span> <span className="font-medium text-gray-900">{product.sku}</span></div>
                    )}
                </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-serif text-lg md:text-xl text-gray-900 border-b pb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Care Instructions */}
            <div className="space-y-4">
                <h3 className="font-serif text-lg md:text-xl text-gray-900 border-b pb-2">Material & Care</h3>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside bg-gray-50 p-4 rounded-lg">
                    <li>Machine wash cold with like colors</li>
                    <li>Do not bleach</li>
                    <li>Tumble dry low</li>
                    <li>Iron on low heat if needed</li>
                    <li>Do not dry clean</li>
                </ul>
            </div>

            {/* Videos */}
            {product.product_media?.some((m: any) => m.media_type === 'video') && (
                <div className="space-y-4">
                    <h3 className="font-serif text-lg md:text-xl text-gray-900 border-b pb-2">Product Videos</h3>
                    <div className="grid gap-4">
                        {product.product_media.filter((m: any) => m.media_type === 'video').map((video: any, i: number) => (
                            <div key={i} className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-md">
                                <video
                                    src={video.url}
                                    controls
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}
