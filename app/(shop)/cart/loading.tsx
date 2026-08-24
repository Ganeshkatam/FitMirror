import { Skeleton } from "@/components/ui/skeleton"

export default function CartLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-8">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-8 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 p-4 border rounded-xl">
                            <Skeleton className="h-24 w-24 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-3">
                                <div className="flex justify-between">
                                    <Skeleton className="h-5 w-1/3" />
                                    <Skeleton className="h-5 w-20" />
                                </div>
                                <Skeleton className="h-4 w-1/4" />
                                <div className="flex justify-between items-center mt-4">
                                    <Skeleton className="h-8 w-24 rounded-md" />
                                    <Skeleton className="h-8 w-20 rounded-md" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-4">
                    <div className="border rounded-xl p-6 space-y-6 sticky top-24">
                        <Skeleton className="h-6 w-32" />
                        <div className="space-y-4">
                            <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>
                            <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>
                            <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /></div>
                            <div className="border-t pt-4 flex justify-between">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-12 w-full rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}
