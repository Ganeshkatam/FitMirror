import { ProductImage } from '@/lib/service/media';
'use client'

import { Star, CheckCircle2, ThumbsUp } from 'lucide-react'
import { ReviewForm } from './review-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { toggleHelpfulVote, getMyReviewVotes } from '@/lib/actions/reviews'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Review {
    id: string
    rating: number
    title: string | null
    content: string | null
    created_at: string
    user?: {
        full_name: string | null
        avatar_url: string | null
    }
    verified_purchase: boolean
    images?: string[]
    fit_rating?: string
    size_purchased?: string
    seller_reply?: string | null
    replied_at?: string | null
    helpful_count?: number
}

interface ReviewListProps {
    productId: string
    productName: string
    productImage?: string
    reviews: Review[]
}

export function ReviewList({ productId, productName, productImage, reviews }: ReviewListProps) {
    const totalReviews = reviews.length
    const avgRating = totalReviews > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
        : 0

    // Calculate Distribution
    const distribution = Array(5).fill(0)
    reviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) distribution[5 - r.rating]++
    })

    const [myVotes, setMyVotes] = useState<Set<string>>(new Set())
    const [votesCount, setVotesCount] = useState<Record<string, number>>(
        reviews.reduce((acc, r) => ({ ...acc, [r.id]: r.helpful_count || 0 }), {})
    )

    useEffect(() => {
        const fetchVotes = async () => {
            const ids = reviews.map(r => r.id)
            if (ids.length === 0) return
            const votedIds = await getMyReviewVotes(ids)
            setMyVotes(new Set(votedIds))
        }
        fetchVotes()
    }, [reviews])

    const handleVote = async (reviewId: string) => {
        const isVoted = myVotes.has(reviewId)

        // Optimistic Update
        setMyVotes(prev => {
            const next = new Set(prev)
            if (isVoted) next.delete(reviewId)
            else next.add(reviewId)
            return next
        })
        setVotesCount(prev => ({
            ...prev,
            [reviewId]: Math.max(0, (prev[reviewId] || 0) + (isVoted ? -1 : 1))
        }))

        // Server Action
        const result = await toggleHelpfulVote(reviewId)
        if (!result || !result.success) {
            // Revert
            toast.error(result?.error || "Failed to vote")
            setMyVotes(prev => {
                const next = new Set(prev)
                if (isVoted) next.add(reviewId)
                else next.delete(reviewId)
                return next
            })
            setVotesCount(prev => ({
                ...prev,
                [reviewId]: Math.max(0, (prev[reviewId] || 0) + (isVoted ? 1 : -1))
            }))
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Summary Card */}
                <Card className="p-6 w-full md:w-1/3 space-y-6 bg-stone-50 border-stone-100">
                    <div className="text-center space-y-2">
                        <div className="text-5xl font-serif font-bold text-gray-900">{avgRating}</div>
                        <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-5 w-5 ${star <= Number(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{totalReviews} Reviews</p>
                    </div>

                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((stars, i) => {
                            const count = distribution[i] // i=0 is 5 stars
                            const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                            return (
                                <div key={stars} className="flex items-center gap-2 text-xs">
                                    <span className="w-12 font-medium text-gray-600">{stars} Stars</span>
                                    <Progress value={percent} className="h-2" />
                                    <span className="w-8 text-right text-gray-400">{count}</span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="pt-4">
                        <ReviewForm
                            productId={productId}
                            productName={productName}
                            productImage={productImage}
                        />
                    </div>
                </Card>

                {/* Reviews Grid */}
                <div className="flex-1 w-full space-y-6">
                    {reviews.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                            <p>No reviews yet. Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="border-b pb-6 last:border-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={review.user?.avatar_url || ''} />
                                            <AvatarFallback>{review.user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                                {review.user?.full_name || 'Anonymous'}
                                                {review.verified_purchase && (
                                                    <span className="text-[10px] text-green-600 flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-full">
                                                        <CheckCircle2 className="h-3 w-3" /> Verified
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                                {review.size_purchased && (
                                                    <span className="mx-2">• Size: {review.size_purchased}</span>
                                                )}
                                            </div>
                                            {review.fit_rating && (
                                                <div className="mt-1">
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${review.fit_rating === 'true_to_size'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {review.fit_rating === 'runs_small' && 'Runs Small'}
                                                        {review.fit_rating === 'true_to_size' && 'True to Size'}
                                                        {review.fit_rating === 'runs_large' && 'Runs Large'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {review.title && <h4 className="font-bold text-sm mb-1">{review.title}</h4>}
                                <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>

                                {/* Review Images */}
                                {review.images && review.images.length > 0 && (
                                    <div className="flex gap-2 mt-3">
                                        {review.images.map((img, i) => (
                                            <Dialog key={i}>
                                                <DialogTrigger asChild>
                                                    <div className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer hover:opacity-90 border border-gray-200">
                                                        <Image
                                                            src={img}
                                                            alt="Review image"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-black/90 border-none">
                                                    <div className="relative w-full h-[80vh]">
                                                        <Image
                                                            src={img}
                                                            alt="Review image"
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        ))}
                                    </div>
                                )}


                                {/* Seller Reply */}
                                {
                                    review.seller_reply && (
                                        <div className="mt-4 ml-8 p-4 bg-stone-50 border-l-2 border-stone-300 rounded-r-md">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-bold text-sm text-stone-900">Seller Response</span>
                                                {review.replied_at && (
                                                    <span className="text-xs text-stone-500">
                                                        {formatDistanceToNow(new Date(review.replied_at), { addSuffix: true })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-stone-700">{review.seller_reply}</p>
                                        </div>
                                    )
                                }

                                {/* Helpful Button */}
                                <div className="mt-4 flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 px-2 gap-1.5 text-xs font-medium rounded-full hover:bg-stone-100",
                                            myVotes.has(review.id) ? "text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-500"
                                        )}
                                        onClick={() => handleVote(review.id)}
                                    >
                                        <ThumbsUp className={cn("h-3.5 w-3.5", myVotes.has(review.id) && "fill-current")} />
                                        Helpful ({votesCount[review.id] || 0})
                                    </Button>
                                    <span className="text-xs text-gray-400">|</span>
                                    <span className="text-xs text-gray-400">Report</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div >
    )
}
