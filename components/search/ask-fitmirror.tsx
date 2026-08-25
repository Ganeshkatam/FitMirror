'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import {
    Search,
    Sparkles,
    X,
    ArrowRight,
    Clock,
    TrendingUp,
    Mic,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
    products: any[]
    total: number
    interpretation: any
    response: string
    query: string
}

interface AskFitMirrorProps {
    className?: string
    placeholder?: string
}

/**
 * Ask FitMirror - Unified AI Search Bar
 * 
 * Single input for natural language product search.
 * "Show me red dresses under 2000" → structured search + results
 */
export function AskFitMirror({
    className = '',
    placeholder = 'Ask FitMirror anything...'
}: AskFitMirrorProps) {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<SearchResult | null>(null)
    const [recentSearches, setRecentSearches] = useState<string[]>([])

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('fitmirror_recent_searches')
        if (saved) {
            setRecentSearches(JSON.parse(saved).slice(0, 5))
        }
    }, [])

    // Save search to recent
    const saveSearch = (q: string) => {
        const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5)
        setRecentSearches(updated)
        localStorage.setItem('fitmirror_recent_searches', JSON.stringify(updated))
    }

    // Execute AI search
    const handleSearch = useCallback(async () => {
        if (!query.trim() || query.length < 2) return

        setLoading(true)
        try {
            const res = await fetch('/api/search/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() })
            })

            if (res.ok) {
                const data = await res.json()
                setResult(data)
                saveSearch(query.trim())
            }
        } catch (error) {
            console.error('Search failed:', error)
        }
        setLoading(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query])

    // Navigate to full results
    const goToResults = () => {
        const params = new URLSearchParams({
            q: query,
            ...(result?.interpretation?.category && { category: result.interpretation.category }),
            ...(result?.interpretation?.gender && { gender: result.interpretation.gender }),
            ...(result?.interpretation?.sortBy && { sort: result.interpretation.sortBy })
        })
        router.push(`/shop?${params.toString()}`)
        setIsOpen(false)
    }

    // Clear and close
    const handleClear = () => {
        setQuery('')
        setResult(null)
        inputRef.current?.focus()
    }

    // Trending suggestions
    const trendingSuggestions = [
        'Summer dresses under 2000',
        'Men\'s formal shirts',
        'Trending ethnic wear',
        'Party wear for women'
    ]

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200",
                    "rounded-full transition-all text-sm text-gray-600",
                    "border border-transparent hover:border-gray-300",
                    className
                )}
            >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="hidden sm:inline">Ask FitMirror</span>
                <Search className="h-4 w-4 sm:hidden" />
            </button>

            {/* Search Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl p-0 gap-0">
                    <DialogHeader className="p-4 pb-2 border-b">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            Ask FitMirror
                        </DialogTitle>
                    </DialogHeader>

                    {/* Search Input */}
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder={placeholder}
                                className="pl-10 pr-20 h-12 text-base rounded-full"
                                autoFocus
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {query && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClear}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={handleSearch}
                                    disabled={loading || query.length < 2}
                                    className="h-8 rounded-full"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Example queries */}
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs text-muted-foreground">Try:</span>
                            {['Red dresses under ₹2000', 'Men\'s casual shirts', 'Party wear'].map(example => (
                                <button
                                    key={example}
                                    onClick={() => {
                                        setQuery(example)
                                        handleSearch()
                                    }}
                                    className="text-xs px-2 py-0.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-3/4" />
                                <div className="grid grid-cols-2 gap-3">
                                    {[...Array(4)].map((_, i) => (
                                        <Skeleton key={i} className="aspect-square rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        ) : result ? (
                            <div className="space-y-4">
                                {/* AI Response */}
                                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                                    <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm">{result.response}</p>
                                </div>

                                {/* Interpretation badges */}
                                {result.interpretation && (
                                    <div className="flex flex-wrap gap-2">
                                        {result.interpretation.category && (
                                            <Badge variant="secondary">
                                                Category: {result.interpretation.category}
                                            </Badge>
                                        )}
                                        {result.interpretation.gender && (
                                            <Badge variant="secondary">
                                                For: {result.interpretation.gender}
                                            </Badge>
                                        )}
                                        {result.interpretation.colors?.map((c: string) => (
                                            <Badge key={c} variant="outline">
                                                {c}
                                            </Badge>
                                        ))}
                                        {result.interpretation.maxPrice && (
                                            <Badge variant="outline">
                                                Under ₹{result.interpretation.maxPrice.toLocaleString()}
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Product Grid */}
                                {result.products.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {result.products.slice(0, 8).map((product: any) => (
                                                <button
                                                    key={product.id || product.product_id}
                                                    onClick={() => {
                                                        router.push(`/product/${product.id || product.product_id}`)
                                                        setIsOpen(false)
                                                    }}
                                                    className="text-left group"
                                                >
                                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                        <Image
                                                            src={product.image || (typeof product.images?.[0] === 'string' ? (typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.src) : (product.images?.[0] as any)?.src) || '/placeholder.jpg'}
                                                            alt={product.name}
                                                            className="object-cover transition-transform group-hover:scale-105"
                                                            fill
                                                        />
                                                    </div>
                                                    <p className="text-xs mt-1 truncate font-medium">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs font-bold">
                                                        ₹{product.price?.toLocaleString('en-IN')}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>

                                        {result.total > 8 && (
                                            <Button
                                                onClick={goToResults}
                                                className="w-full mt-2"
                                                variant="outline"
                                            >
                                                View all {result.total} results
                                                <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No products found. Try a different search!</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                                            <Clock className="h-4 w-4" /> Recent
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {recentSearches.map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        setQuery(s)
                                                        handleSearch()
                                                    }}
                                                    className="text-sm px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Trending */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                                        <TrendingUp className="h-4 w-4" /> Trending
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {trendingSuggestions.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    setQuery(s)
                                                    handleSearch()
                                                }}
                                                className="text-sm px-3 py-1.5 border rounded-full hover:bg-gray-50 transition-colors"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
