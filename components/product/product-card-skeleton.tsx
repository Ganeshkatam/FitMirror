import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export function ProductCardSkeleton() {
    return (
        <Card className="overflow-hidden h-full flex flex-col">
            <div className="relative aspect-[3/4]">
                <Skeleton className="h-full w-full" />
            </div>

            <CardHeader className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </CardHeader>

            <CardContent className="p-4 pt-0 flex-1">
                <div className="flex gap-1 mt-1">
                    <Skeleton className="h-3 w-8 rounded-full" />
                    <Skeleton className="h-3 w-8 rounded-full" />
                    <Skeleton className="h-3 w-8 rounded-full" />
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </CardFooter>
        </Card>
    )
}
