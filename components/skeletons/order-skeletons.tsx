import { Skeleton } from "@/components/ui/skeleton"

export function OrderRowSkeleton() {
    return (
        <div className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
        </div>
    )
}

export function OrderListSkeleton() {
    return (
        <div className="space-y-4">
            <OrderRowSkeleton />
            <OrderRowSkeleton />
            <OrderRowSkeleton />
            <OrderRowSkeleton />
        </div>
    )
}
