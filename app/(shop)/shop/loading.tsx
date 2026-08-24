import { ProductCardSkeleton } from '@/components/skeletons/product-skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function ShopLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans">
            {/* Top Toolbar Skeleton */}
            <div className="border-b sticky top-14 md:top-16 z-30 bg-white/95 backdrop-blur-xl shadow-sm">
                <div className="w-full max-w-[1920px] mx-auto px-3 md:px-8 py-2 md:py-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                        <div>
                            <Skeleton className="h-4 w-48 mb-1" />
                            <Skeleton className="h-8 w-64" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-24 rounded-full" />
                            <Skeleton className="h-9 w-32 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-[1920px] mx-auto px-2 md:px-8 flex items-start gap-4 md:gap-10 py-3 md:py-8">
                {/* Sidebar Skeleton */}
                <aside className="hidden md:block w-56 lg:w-72 shrink-0 sticky top-36 h-[calc(100vh-10rem)] pr-4">
                    <div className="flex items-center justify-between mb-6">
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                </aside>

                {/* Grid Skeleton */}
                <main className="flex-1 min-w-0">
                    {/* Quick Filters */}
                    <div className="flex gap-2 mb-6 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
                        ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-1.5 md:gap-x-6 md:gap-y-12">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
                                <ProductCardSkeleton />
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
