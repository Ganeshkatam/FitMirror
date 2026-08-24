'use client'

import * as React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { Search, Loader2, TrendingUp, Clock, ArrowRight, Sparkles, X, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { VoiceSearchButton } from './search/voice-search-button'
import { VisualSearchButton } from './search/visual-search-button'

interface Product {
    id: string
    name: string
    category: string
    price: number
    original_price?: number
    image: string | null
    discount?: number
}

interface Suggestion {
    text: string
    type: 'trending' | 'category' | 'recent' | 'product'
}

const TRENDING_SEARCHES: Suggestion[] = [
    { text: 'Summer Dresses', type: 'trending' },
    { text: 'Floral Tops', type: 'trending' },
    { text: 'Maxi Skirts', type: 'trending' },
    { text: 'Casual Shirts', type: 'trending' },
    { text: 'Party Wear', type: 'trending' },
]

const QUICK_CATEGORIES = [
    { name: 'Dresses', icon: '👗', gradient: 'from-pink-500 to-rose-500' },
    { name: 'Tops', icon: '👚', gradient: 'from-purple-500 to-indigo-500' },
    { name: 'Bottoms', icon: '👖', gradient: 'from-blue-500 to-cyan-500' },
    { name: 'Ethnic', icon: '🥻', gradient: 'from-orange-500 to-amber-500' },
    { name: 'Accessories', icon: '👜', gradient: 'from-emerald-500 to-teal-500' },
]

export function GlobalSearch() {
    const searchParams = useSearchParams()
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState(searchParams.get('q') || '')
    const [results, setResults] = React.useState<Product[]>([])
    const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
    const [loading, setLoading] = React.useState(false)
    const [recentSearches, setRecentSearches] = React.useState<string[]>([])
    const [selectedIndex, setSelectedIndex] = React.useState(-1)
    const router = useRouter()
    const pathname = usePathname()
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Derive display term from Query OR Category Slug
    const categorySlug = pathname?.startsWith('/shop/') ? pathname.split('/shop/')[1]?.split('/')[0] : ''
    const displayTerm = (searchParams.get('q') || (categorySlug && categorySlug !== 'shop' ? categorySlug.replace(/-/g, ' ') : ''))

    // Sync query when URL changes (e.g. back button, initial load, or external clear)
    React.useEffect(() => {
        if (!open) {
            const term = displayTerm ? decodeURIComponent(displayTerm.replace(/-/g, ' ')) : ''
            if (query !== term) {
                setQuery(term)
            }
        }
    }, [displayTerm, open, query])

    // Load recent searches from localStorage
    React.useEffect(() => {
        const stored = localStorage.getItem('recentSearches')
        if (stored) {
            setRecentSearches(JSON.parse(stored).slice(0, 5))
        }
    }, [])

    // Keyboard shortcut
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    // Debounced search with suggestions
    React.useEffect(() => {
        if (!query || query.length < 2) {
            setResults([])
            setSuggestions([])
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const [searchRes, autoRes] = await Promise.all([
                    fetch('/api/engine/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            query,
                            context: 'shop',
                            limit: 6
                        })
                    }),
                    fetch(`/api/engine/autocomplete?q=${encodeURIComponent(query)}`)
                ])

                const searchData = await searchRes.json()
                const autoData = await autoRes.json()

                if (searchData.results) {
                    const mapped = searchData.results.map((item: any) => ({
                        id: item.product_id || item.id,
                        name: item.title || item.name,
                        category: item.category,
                        price: item.price,
                        original_price: item.original_price,
                        image: item.images?.[0] || item.image || null,
                        discount: item.discount
                    }))
                    setResults(mapped)
                }

                if (autoData.suggestions) {
                    setSuggestions(autoData.suggestions)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }, 200) // Faster debounce for better UX

        return () => clearTimeout(timer)
    }, [query])

    // Save to recent searches
    const saveRecentSearch = (term: string) => {
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
        setRecentSearches(updated)
        localStorage.setItem('recentSearches', JSON.stringify(updated))
    }

    const handleSelect = (productId: string) => {
        if (query) saveRecentSearch(query)
        setOpen(false)
        setQuery('')
        router.push(`/product/${productId}`)
    }

    const handleSearch = (searchQuery?: string) => {
        const term = searchQuery || query
        if (!term) return
        saveRecentSearch(term)
        setOpen(false)
        setQuery('')
        router.push(`/shop?q=${encodeURIComponent(term)}`)
    }

    const handleSuggestionClick = (suggestion: Suggestion) => {
        setOpen(false)
        setQuery('')
        if (suggestion.type === 'category') {
            router.push(`/shop/${suggestion.text.toLowerCase()}`)
        } else {
            router.push(`/shop?q=${encodeURIComponent(suggestion.text)}`)
        }
    }

    const handleCategoryClick = (category: string) => {
        setOpen(false)
        router.push(`/shop/${category.toLowerCase()}`)
    }

    const clearRecentSearches = () => {
        setRecentSearches([])
        localStorage.removeItem('recentSearches')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (selectedIndex >= 0 && selectedIndex < results.length) {
                handleSelect(results[selectedIndex].id)
            } else {
                handleSearch()
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => Math.max(prev - 1, -1))
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }



    return (
        <>
            {/* Desktop Search Bar Trigger */}
            <button
                onClick={() => setOpen(true)}
                className={cn(
                    "hidden md:flex items-center gap-2 h-10 px-4 rounded-full text-sm transition-all min-w-[220px] lg:min-w-[320px] border shadow-sm hover:shadow-md group",
                    displayTerm ? "bg-white border-amber-200 text-stone-900" : "bg-muted/50 hover:bg-muted/80 border-border text-muted-foreground"
                )}
            >
                <Search className={cn("h-4 w-4 transition-colors", displayTerm ? "text-amber-600" : "text-muted-foreground group-hover:text-foreground")} />
                <span className={cn("flex-1 text-left truncate capitalize", displayTerm ? "font-medium" : "text-muted-foreground/80 group-hover:text-muted-foreground")}>
                    {displayTerm ? decodeURIComponent(displayTerm.replace(/-/g, ' ')) : "Search products, categories..."}
                </span>
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Mobile Search Button */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-muted"
                onClick={() => setOpen(true)}
            >
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 rounded-none sm:rounded-2xl border-0 sm:border sm:border-stone-200 shadow-2xl bg-white text-stone-900 h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[85vh] w-full sm:w-auto inset-0 sm:inset-auto translate-x-0 sm:translate-x-[-50%] translate-y-0 sm:translate-y-[-50%]">
                    <VisuallyHidden>
                        <DialogTitle>Search Products</DialogTitle>
                    </VisuallyHidden>

                    {/* Search Input */}
                    <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3 sm:py-3 bg-stone-50/50 backdrop-blur-sm">
                        <Search className="h-5 w-5 text-stone-400 flex-shrink-0" />
                        <Input
                            ref={inputRef}
                            placeholder="Search for products, categories, brands..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setSelectedIndex(-1)
                            }}
                            onKeyDown={handleKeyDown}
                            className="flex-1 border-0 focus-visible:ring-0 px-2 py-0 text-base bg-transparent placeholder:text-stone-400 text-stone-900 h-auto font-medium"
                            autoFocus
                        />

                        {/* Intelligent Search Tools — always visible */}
                        <div className="flex items-center gap-1 border-l pl-1 border-stone-200">
                            <VoiceSearchButton onResult={(text) => {
                                setQuery(text)
                                // Trigger search immediately after voice transcription
                                setTimeout(() => handleSearch(text), 100)
                            }} />
                            <VisualSearchButton onResult={(text) => {
                                setQuery(text)
                                setTimeout(() => handleSearch(text), 100)
                            }} />
                        </div>

                        {query && (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setQuery('')
                                    setResults([])
                                    inputRef.current?.focus()
                                }}
                                className="p-1 hover:bg-stone-200 rounded-full transition-colors flex items-center justify-center h-6 w-6"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4 text-stone-500" />
                            </button>
                        )}
                        {loading && <Loader2 className="h-5 w-5 animate-spin text-amber-600" />}
                    </div>

                    <div className="max-h-[450px] overflow-y-auto">
                        {/* Search Results */}
                        {results.length > 0 && (
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Products</span>
                                    <button
                                        onClick={() => handleSearch()}
                                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                                    >
                                        View all results <ArrowRight className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {results.map((product, index) => (
                                        <button
                                            key={product.id}
                                            onClick={() => handleSelect(product.id)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all",
                                                selectedIndex === index
                                                    ? "bg-primary/5 ring-1 ring-primary/20"
                                                    : "hover:bg-accent"
                                            )}
                                        >
                                            {product.image ? (
                                                <div className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                                                    <Image
                                                        src={product.image}
                                                        alt=""
                                                        className="object-cover"
                                                        fill
                                                        sizes="56px"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-14 w-14 bg-muted rounded-lg flex items-center justify-center text-2xl">
                                                    👗
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate text-foreground">{product.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-sm font-semibold text-primary">₹{product.price?.toLocaleString('en-IN')}</span>
                                                    {product.original_price && product.original_price > product.price && (
                                                        <>
                                                            <span className="text-xs text-muted-foreground line-through">₹{product.original_price.toLocaleString('en-IN')}</span>
                                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 border-0">
                                                                {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                                                            </Badge>
                                                        </>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground capitalize mt-0.5">{product.category}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                                        </button>
                                    ))}
                                </div>

                                {/* Related Suggestions */}
                                {suggestions.length > 0 && (
                                    <div className="mt-4 pt-3 border-t">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Suggestions</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {suggestions.map((sug, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSuggestionClick(sug)}
                                                    className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-full text-sm font-medium transition-colors flex items-center gap-1 text-secondary-foreground"
                                                >
                                                    {sug.type === 'category' ? <Tag className="h-3 w-3" /> : <Search className="h-3 w-3" />}
                                                    {sug.text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* No Results */}
                        {query.length >= 2 && !loading && results.length === 0 && (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    🔍
                                </div>
                                <p className="font-medium text-foreground">No products found for &quot;{query}&quot;</p>
                                <p className="text-sm text-muted-foreground mt-1">Try different keywords or browse categories</p>
                                <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    {QUICK_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.name}
                                            onClick={() => handleCategoryClick(cat.name)}
                                            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-sm font-medium transition-colors text-secondary-foreground"
                                        >
                                            {cat.icon} {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Default State - Trending & Recent */}
                        {query.length < 2 && (
                            <div className="p-4 space-y-6">
                                {/* Quick Categories */}
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1 mb-3">
                                        <Sparkles className="h-3 w-3" /> Quick Shop
                                    </span>
                                    <div className="grid grid-cols-5 gap-2">
                                        {QUICK_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.name}
                                                onClick={() => handleCategoryClick(cat.name)}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br ${cat.gradient} text-white hover:scale-105 transition-transform shadow-lg`}
                                            >
                                                <span className="text-2xl">{cat.icon}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-wide">{cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                <Clock className="h-3 w-3" /> Recent
                                            </span>
                                            <button onClick={clearRecentSearches} className="text-xs text-muted-foreground hover:text-destructive">
                                                Clear
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {recentSearches.map(term => (
                                                <button
                                                    key={term}
                                                    onClick={() => handleSearch(term)}
                                                    className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-full text-sm transition-colors flex items-center gap-1.5 text-secondary-foreground"
                                                >
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Trending Searches */}
                                <div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1 mb-2">
                                        <TrendingUp className="h-3 w-3" /> Trending Now
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {TRENDING_SEARCHES.map(item => (
                                            <button
                                                key={item.text}
                                                onClick={() => handleSearch(item.text)}
                                                className="px-3 py-1.5 border border-border hover:border-primary hover:bg-primary/5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 text-foreground"
                                            >
                                                <TrendingUp className="h-3 w-3 text-orange-500" />
                                                {item.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Keyboard Hint */}
                                <div className="text-center pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↵</kbd> to search
                                        {' • '}
                                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑</kbd>
                                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono ml-0.5">↓</kbd> to navigate
                                        {' • '}
                                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd> to close
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
