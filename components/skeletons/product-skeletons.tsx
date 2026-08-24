import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
    return (
        <div className="flex flex-col space-y-3">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    )
}

export function PDPSkeleton() {
    return (
        <div className="container px-4 py-8 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Gallery Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                    <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="aspect-square rounded-md" />
                        <Skeleton className="aspect-square rounded-md" />
                        <Skeleton className="aspect-square rounded-md" />
                        <Skeleton className="aspect-square rounded-md" />
                    </div>
                </div>

                {/* Info Skeleton */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-20" /> {/* Category */}
                        <Skeleton className="h-10 w-3/4" /> {/* Title */}
                        <Skeleton className="h-6 w-1/4" /> {/* Price */}
                    </div>

                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>

                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" /> {/* Add to Cart */}
                        <Skeleton className="h-12 w-full" /> {/* Actions */}
                    </div>
                </div>
            </div>
        </div>
    )
}
