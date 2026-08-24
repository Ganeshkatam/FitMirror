import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StorefrontService } from '@/lib/service/storefront'

// Fallback images for sub-categories (until we add image_url to DB)
const SUB_CAT_IMAGES: Record<string, string> = {
    'dresses': "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800",
    'w-tops': "https://images.unsplash.com/photo-1550614000-4b9519e02d48?q=80&w=800",
    'w-jackets': "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format",
    'w-pants': "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format",
    'm-tshirts': "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format",
    'm-jackets': "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&auto=format",
    'm-pants': "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format",
    'k-clothing': "https://images.unsplash.com/photo-1519238806101-3dae78963e06?w=800&auto=format"
}

export default async function ShopCategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params
    const categorySlug = category.toLowerCase()

    // Fetch Dynamic Data
    const categoryData = await StorefrontService.getCategoryBySlug(categorySlug)

    if (!categoryData) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-4xl font-bold capitalize mb-4">{categorySlug}</h1>
                <p className="text-muted-foreground mb-8">Category not found.</p>
                <Link href="/shop"><Button>Go to Shop</Button></Link>
            </div>
        )
    }

    // Brands - Mock for now (could be fetched via distinct brand query)
    const brands = ["Nike", "Adidas", "Puma", "Levis", "Zara", "H&M"]

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
                <img
                    src={categoryData.hero_image_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600"}
                    alt={categoryData.name}
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-center">
                    <div className="text-white max-w-2xl px-4">
                        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 drop-shadow-lg capitalize">
                            {categoryData.name}
                        </h1>
                        <p className="text-lg md:text-xl font-medium mb-8 drop-shadow-md">
                            {categoryData.description || `Explore our latest collection of ${categoryData.name}`}
                        </p>
                        <Link href={`/shop?category=${categorySlug}`}>
                            <Button size="lg" className="rounded-full bg-white text-black hover:bg-gray-100 border-none uppercase tracking-wide font-bold">
                                Shop All {categoryData.name}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Brands Strip */}
            <div className="border-b bg-gray-50/50">
                <div className="container mx-auto px-4 py-8">
                    <p className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
                        Biggest Deals on Top Brands
                    </p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {brands.map(brand => (
                            <span key={brand} className="text-xl md:text-2xl font-bold font-serif text-gray-800">
                                {brand}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Curated Collections (Sub Categories) */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-8 uppercase tracking-tight">Shop By Category</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {categoryData.sub_categories && categoryData.sub_categories.map((sub: any) => (
                            <Link href={`/shop?category=${sub.slug}`} key={sub.id} className="group block">
                                <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-3 bg-gray-100">
                                    <img
                                        src={SUB_CAT_IMAGES[sub.slug] || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800"}
                                        alt={sub.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                                </div>
                                <h3 className="font-bold text-lg">{sub.name}</h3>
                                <p className="text-sm text-muted-foreground">{sub.group_name !== 'Other' ? sub.group_name : 'Collection'}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
