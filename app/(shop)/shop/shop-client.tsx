'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Sparkles, Filter, X, SlidersHorizontal, Search, ChevronDown, Star } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/components/product/product-card'
import { MasonryGrid } from '@/components/shop/masonry-grid'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { LayoutGrid, Grip } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ProductCardSkeleton } from '@/components/skeletons/product-skeletons'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useInView } from 'react-intersection-observer'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// --- Constants ---
const GENDERS = [
    { value: 'men', label: 'Men', icon: '👨' },
    { value: 'women', label: 'Women', icon: '👩' },
    { value: 'boys', label: 'Boys', icon: '👦' },
    { value: 'girls', label: 'Girls', icon: '👧' },
]

const SIZES = [
    { value: 'xs', label: 'XS' },
    { value: 's', label: 'S' },
    { value: 'm', label: 'M' },
    { value: 'l', label: 'L' },
    { value: 'xl', label: 'XL' },
    { value: 'xxl', label: 'XXL' },
    { value: '2xl', label: '2XL' },
    { value: '3xl', label: '3XL' },
]

import { COLORS } from '@/lib/constants/colors'

const DISCOUNTS = [
    { value: '10', label: '10% and above' },
    { value: '20', label: '20% and above' },
    { value: '30', label: '30% and above' },
    { value: '40', label: '40% and above' },
    { value: '50', label: '50% and above' },
    { value: '60', label: '60% and above' },
]

const MATERIALS = [
    { value: 'cotton', label: 'Cotton' },
    { value: 'polyester', label: 'Polyester' },
    { value: 'silk', label: 'Silk' },
    { value: 'linen', label: 'Linen' },
    { value: 'wool', label: 'Wool' },
    { value: 'denim', label: 'Denim' },
    { value: 'rayon', label: 'Rayon' },
    { value: 'chiffon', label: 'Chiffon' },
]

const SORT_OPTIONS = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'discount', label: 'Better Discount' },
    { value: 'popularity', label: 'Popularity' },
    { value: 'rating', label: 'Customer Rating' },
]

const QUICK_FILTERS = [
    { tag: 'New In', emoji: '✨', gradient: 'from-purple-500 to-pink-500', filter: 'new' },
    { tag: 'Best Sellers', emoji: '🔥', gradient: 'from-orange-500 to-red-500', filter: 'bestseller' },
    { tag: 'Sale', emoji: '💰', gradient: 'from-green-500 to-emerald-500', filter: 'sale' },
    { tag: 'Sustainable', emoji: '🌿', gradient: 'from-teal-500 to-green-500', filter: 'sustainable' },
    { tag: 'Premium', emoji: '👑', gradient: 'from-amber-500 to-yellow-500', filter: 'premium' },
    { tag: 'Try-On Ready', emoji: '👗', gradient: 'from-indigo-500 to-blue-500', filter: 'tryon' },
]

interface ShopClientProps {
    slug?: string[]
    initialProducts?: any[]
    initialFacets?: any
    allCategories?: any[]
}

export function ShopClient({ slug, initialProducts = [], initialFacets = { categories: {}, brands: {}, colors: {}, sizes: {} }, allCategories = [] }: ShopClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // URL Params
    const q = searchParams.get('q') || ''
    const urlCategory = searchParams.get('category')
    const sort = searchParams.get('sort') || 'recommended'

    // Price Range State
    const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 10000])
    const minPrice = parseInt(searchParams.get('minPrice') || '0')
    const maxPrice = parseInt(searchParams.get('maxPrice') || '10000')

    // Initialize price from URL
    React.useEffect(() => {
        setPriceRange([minPrice, maxPrice])
    }, [minPrice, maxPrice])

    // Stable Slug Reference
    const safeSlugString = slug ? slug.join(',') : ''

    // Derived Category State
    const effectiveCategories = React.useMemo(() => {
        const cats = urlCategory ? urlCategory.split(',') : []
        const currentSlug = safeSlugString ? safeSlugString.split(',') : []
        if (currentSlug.length > 0) {
            currentSlug.forEach(s => {
                if (!cats.includes(s)) cats.push(s)
            })
        }
        return cats.join(',')
    }, [urlCategory, safeSlugString])

    // Data State
    const [products, setProducts] = React.useState<any[]>(initialProducts)
    const [facets, setFacets] = React.useState<any>(initialFacets)
    const [loading, setLoading] = React.useState(initialProducts.length === 0)
    const [isMirrorMode, setMirrorMode] = React.useState(false)
    const [activeFiltersCount, setActiveFiltersCount] = React.useState(0)

    // Pagination State
    const [page, setPage] = React.useState(1)
    const [hasMore, setHasMore] = React.useState(true)
    const [fetchingMore, setFetchingMore] = React.useState(false)
    const [viewMode, setViewMode] = React.useState<'grid' | 'masonry'>('masonry')

    // Infinite Scroll Observer
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    })

    // Count active filters
    React.useEffect(() => {
        let count = 0
        if (searchParams.get('gender')) count += searchParams.get('gender')!.split(',').length
        if (searchParams.get('category')) count += searchParams.get('category')!.split(',').length
        if (searchParams.get('size')) count += searchParams.get('size')!.split(',').length
        if (searchParams.get('color')) count += searchParams.get('color')!.split(',').length
        if (searchParams.get('brand')) count += searchParams.get('brand')!.split(',').length
        if (searchParams.get('discount')) count++
        if (searchParams.get('minPrice') || searchParams.get('maxPrice')) count++
        if (searchParams.get('pattern')) count += searchParams.get('pattern')!.split(',').length
        if (searchParams.get('occasion')) count += searchParams.get('occasion')!.split(',').length
        if (searchParams.get('sleeve')) count += searchParams.get('sleeve')!.split(',').length
        if (searchParams.get('neck')) count += searchParams.get('neck')!.split(',').length
        if (searchParams.get('fit')) count += searchParams.get('fit')!.split(',').length
        if (searchParams.get('material')) count += searchParams.get('material')!.split(',').length
        setActiveFiltersCount(count)
    }, [searchParams])

    // Load More Effect
    React.useEffect(() => {
        if (inView && hasMore && !fetchingMore && !loading) {
            loadMore()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView, hasMore, fetchingMore, loading])

    // Fetch Data (Filter Change or Initial)
    const isFirstMount = React.useRef(initialProducts.length > 0)

    React.useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false
            return
        }

        const fetchProducts = async () => {
            setLoading(true)
            setPage(1) // Reset page on filter change
            setHasMore(true)

            try {
                const categoryList = effectiveCategories ? effectiveCategories.split(',') : []

                const payload = {
                    query: q,
                    filters: {
                        category: categoryList.length > 0 ? categoryList : undefined,
                        gender: searchParams.get('gender')?.split(',').filter(Boolean),
                        size: searchParams.get('size')?.split(',').filter(Boolean),
                        color: searchParams.get('color')?.split(',').filter(Boolean),
                        brand: searchParams.get('brand')?.split(',').filter(Boolean),
                        minPrice: searchParams.get('minPrice'),
                        maxPrice: searchParams.get('maxPrice'),
                        discount: searchParams.get('discount'),
                        pattern: searchParams.get('pattern')?.split(',').filter(Boolean),
                        occasion: searchParams.get('occasion')?.split(',').filter(Boolean),
                        sleeve: searchParams.get('sleeve')?.split(',').filter(Boolean),
                        neck: searchParams.get('neck')?.split(',').filter(Boolean),
                        fit: searchParams.get('fit')?.split(',').filter(Boolean),
                        material: searchParams.get('material')?.split(',').filter(Boolean),
                    },
                    sort: sort,
                    page: 1, // Start from page 1
                    limit: 24,
                    context: 'shop'
                }

                const res = await fetch('/api/engine/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()

                if (data.results) {
                    setProducts(data.results)
                    if (data.meta?.facets) {
                        setFacets(data.meta.facets)
                    }
                    if (data.results.length < 24) {
                        setHasMore(false)
                    }
                } else {
                    setProducts([])
                    setHasMore(false)
                }
            } catch (error) {
                console.error(error)
                setHasMore(false)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [q, effectiveCategories, sort, searchParams])

    // Load More Function
    const loadMore = async () => {
        if (fetchingMore || !hasMore) return
        setFetchingMore(true)
        const nextPage = page + 1

        try {
            const categoryList = effectiveCategories ? effectiveCategories.split(',') : []

            const payload = {
                query: q,
                filters: {
                    category: categoryList.length > 0 ? categoryList : undefined,
                    gender: searchParams.get('gender')?.split(',').filter(Boolean),
                    size: searchParams.get('size')?.split(',').filter(Boolean),
                    color: searchParams.get('color')?.split(',').filter(Boolean),
                    brand: searchParams.get('brand')?.split(',').filter(Boolean),
                    minPrice: searchParams.get('minPrice'),
                    maxPrice: searchParams.get('maxPrice'),
                    discount: searchParams.get('discount'),
                    pattern: searchParams.get('pattern')?.split(',').filter(Boolean),
                    occasion: searchParams.get('occasion')?.split(',').filter(Boolean),
                    sleeve: searchParams.get('sleeve')?.split(',').filter(Boolean),
                    neck: searchParams.get('neck')?.split(',').filter(Boolean),
                    fit: searchParams.get('fit')?.split(',').filter(Boolean),
                    material: searchParams.get('material')?.split(',').filter(Boolean),
                },
                sort: sort,
                page: nextPage,
                limit: 24,
                context: 'shop'
            }

            const res = await fetch('/api/engine/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()

            if (data.results && data.results.length > 0) {
                setProducts(prev => [...prev, ...data.results])
                setPage(nextPage)
                if (data.results.length < 24) {
                    setHasMore(false)
                }
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Failed to load more products", error)
            setHasMore(false)
        } finally {
            setFetchingMore(false)
        }
    }

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === null) params.delete(key)
        else params.set(key, value)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    const toggleFilter = (key: string, val: string) => {
        if (key === 'q') {
            updateFilter('q', null)
            return
        }

        if (key === 'price') {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('minPrice')
            params.delete('maxPrice')
            setPriceRange([0, 10000]) // Reset local slider state
            router.push(`?${params.toString()}`, { scroll: false })
            return
        }

        if (key === 'category') {
            const currentCats = effectiveCategories ? effectiveCategories.split(',') : []
            let newCats: string[] = []
            if (currentCats.includes(val)) {
                newCats = currentCats.filter(c => c !== val)
            } else {
                newCats = [...currentCats, val]
            }

            // When toggling categories, we always reset to root /shop to handle slug vs query param conflicts
            const params = new URLSearchParams(searchParams.toString())
            if (newCats.length > 0) params.set('category', newCats.join(','))
            else params.delete('category')

            router.push(`/shop?${params.toString()}`, { scroll: false })
            return
        }

        const current = searchParams.get(key)
        let newVals = current ? current.split(',') : []
        if (newVals.includes(val)) {
            newVals = newVals.filter(v => v !== val)
        } else {
            newVals.push(val)
        }
        updateFilter(key, newVals.length > 0 ? newVals.join(',') : null)
    }

    const applyPriceRange = () => {
        const params = new URLSearchParams(searchParams.toString())
        if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString())
        else params.delete('minPrice')
        if (priceRange[1] < 10000) params.set('maxPrice', priceRange[1].toString())
        else params.delete('maxPrice')
        router.push(`?${params.toString()}`, { scroll: false })
    }

    const clearAllFilters = () => {
        router.push('/shop', { scroll: false })
    }

    // Breadcrumbs
    const currentSlugArray = safeSlugString ? safeSlugString.split(',') : []
    const breadcrumbs = [
        { label: 'Home', href: '/' },
        { label: 'Shop', href: '/shop' },
        ...currentSlugArray.map((s, i) => ({
            label: s.replace(/-/g, ' '),
            href: `/shop/${currentSlugArray.slice(0, i + 1).join('/')}`
        }))
    ]

    // Active filter tags
    const getActiveFilterTags = () => {
        const tags: { key: string, value: string, label: string }[] = []

        // Use effectiveCategories for active tags so slug-based categories are shown
        const cats = effectiveCategories ? effectiveCategories.split(',') : []
        cats.forEach(c => tags.push({ key: 'category', value: c, label: c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' ') }))

        const genders = searchParams.get('gender')?.split(',').filter(Boolean) || []
        genders.forEach(g => tags.push({ key: 'gender', value: g, label: GENDERS.find(x => x.value === g)?.label || g }))

        const sizes = searchParams.get('size')?.split(',').filter(Boolean) || []
        sizes.forEach(s => tags.push({ key: 'size', value: s, label: s.toUpperCase() }))

        const colors = searchParams.get('color')?.split(',').filter(Boolean) || []
        colors.forEach(c => tags.push({ key: 'color', value: c, label: COLORS.find(x => x.value === c)?.label || c }))

        const discount = searchParams.get('discount')
        if (discount) tags.push({ key: 'discount', value: discount, label: `${discount}%+ Off` })

        const rating = searchParams.get('rating')
        if (rating) tags.push({ key: 'rating', value: rating, label: `${rating}★ & Up` })

        const inStock = searchParams.get('inStock')
        if (inStock) tags.push({ key: 'inStock', value: inStock, label: 'In Stock Only' })

        const age = searchParams.get('age')
        if (age) {
            age.split(',').forEach(a => {
                tags.push({ key: 'age', value: a, label: a.charAt(0).toUpperCase() + a.slice(1) })
            })
        }

        const dynamicKeys = ['pattern', 'occasion', 'sleeve', 'neck', 'fit', 'material']
        dynamicKeys.forEach(k => {
            const vals = searchParams.get(k)?.split(',').filter(Boolean) || []
            vals.forEach(v => tags.push({ key: k, value: v, label: v }))
        })

        const minP = searchParams.get('minPrice')
        const maxP = searchParams.get('maxPrice')
        if (minP || maxP) {
            const label = minP && maxP ? `₹${minP} - ₹${maxP}` : minP ? `Above ₹${minP}` : `Below ₹${maxP}`
            tags.push({ key: 'price', value: 'range', label })
        }

        const q = searchParams.get('q')
        if (q) tags.push({ key: 'q', value: q, label: `Search: "${q}"` })

        return tags
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white font-sans">
            {/* Top Toolbar */}
            <div className="border-b sticky top-14 md:top-16 z-30 bg-white/95 backdrop-blur-xl shadow-sm">
                <div className="w-full max-w-[1920px] mx-auto px-3 md:px-8 py-2 md:py-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                        {/* Breadcrumbs & Count */}
                        <div>
                            <nav className="flex items-center text-[9px] md:text-[11px] uppercase tracking-wider text-muted-foreground mb-1 space-x-1.5 md:space-x-2">
                                {breadcrumbs.map((b, i) => (
                                    <React.Fragment key={b.href}>
                                        <Link href={b.href} className="hover:text-black transition-colors capitalize">{b.label}</Link>
                                        {i < breadcrumbs.length - 1 && <span className="text-gray-300">/</span>}
                                    </React.Fragment>
                                ))}
                                {q && (
                                    <>
                                        <span className="text-gray-300">/</span>
                                        <span className="text-gray-500 truncate max-w-[100px]">&quot;{q}&quot;</span>
                                    </>
                                )}
                            </nav>
                            <h1 className="font-serif text-lg md:text-3xl text-gray-900 tracking-tight flex items-baseline gap-1.5 md:gap-2 capitalize">
                                {currentSlugArray.length > 0 ? currentSlugArray[currentSlugArray.length - 1].replace(/-/g, ' ') : (q ? `Results for "${q}"` : 'All Products')}
                                <span className="text-[10px] md:text-sm font-sans font-normal text-gray-500">
                                    ({loading ? '...' : products.length})
                                </span>
                            </h1>
                        </div>

                        {/* Top Controls */}
                        <div className="flex items-center gap-2 md:gap-3">
                            {/* Mobile Filter */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="md:hidden border-gray-300 rounded-full text-[10px] px-3 py-1.5 h-auto uppercase tracking-wide font-bold relative">
                                        <Filter className="mr-1.5 h-3 w-3" /> Filters
                                        {activeFiltersCount > 0 && (
                                            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] bg-black">{activeFiltersCount}</Badge>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[320px] p-0 flex flex-col">
                                    <SheetHeader className="p-4 border-b">
                                        <div className="flex items-center justify-between">
                                            <SheetTitle className="font-serif text-xl">Filters</SheetTitle>
                                            {activeFiltersCount > 0 && (
                                                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-red-500 text-xs">
                                                    Clear All
                                                </Button>
                                            )}
                                        </div>
                                    </SheetHeader>
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <SidebarFilters
                                            searchParams={searchParams}
                                            toggleFilter={toggleFilter}
                                            facets={facets}
                                            priceRange={priceRange}
                                            setPriceRange={setPriceRange}
                                            applyPriceRange={applyPriceRange}
                                            selectedCategories={effectiveCategories ? effectiveCategories.split(',') : []}
                                            updateFilter={updateFilter}
                                            allCategories={allCategories}
                                        />
                                    </div>
                                    <SheetFooter className="p-4 border-t">
                                        <Button className="w-full" onClick={() => { }}>
                                            Show {products.length} Results
                                        </Button>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>

                            {/* Mirror Mode Toggle */}
                            <div className="flex items-center gap-2 border-r pr-4 mr-4 hidden md:flex">
                                <Label htmlFor="mirror-mode" className="text-xs uppercase font-bold text-gray-600 flex items-center gap-1 cursor-pointer">
                                    <Sparkles className="h-3 w-3 text-amber-500" /> Try-On
                                </Label>
                                <Switch
                                    id="mirror-mode"
                                    checked={isMirrorMode}
                                    onCheckedChange={setMirrorMode}
                                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-pink-600"
                                />
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center border-r pr-2 mr-2 hidden md:flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-8 w-8", viewMode === 'grid' ? "bg-gray-100" : "")}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-8 w-8", viewMode === 'masonry' ? "bg-gray-100" : "")}
                                    onClick={() => setViewMode('masonry')}
                                >
                                    <Grip className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Sort */}
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="text-[10px] md:text-xs uppercase tracking-wider text-gray-500 font-medium hidden sm:inline-block">Sort</span>
                                <Select value={sort} onValueChange={(v) => updateFilter('sort', v)}>
                                    <SelectTrigger className="w-[120px] md:w-[180px] h-7 md:h-9 border-gray-200 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wide bg-transparent focus:ring-0 hover:border-gray-400 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent align="end" className="rounded-xl shadow-xl border-gray-100 p-1">
                                        {SORT_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className="text-xs md:text-sm py-1.5 md:py-2 px-2 md:px-3 rounded-md cursor-pointer">
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Tags */}
                    {getActiveFilterTags().length > 0 && (
                        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                            {getActiveFilterTags().map((tag, i) => (
                                <Badge key={`${tag.key}-${tag.value}-${i}`} variant="secondary" className="rounded-full pl-3 pr-1 py-1 flex items-center gap-1 whitespace-nowrap bg-gray-100 hover:bg-gray-200">
                                    <span className="text-xs">{tag.label}</span>
                                    <button onClick={() => toggleFilter(tag.key, tag.value)} className="ml-1 h-4 w-4 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center">
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            ))}
                            <button onClick={clearAllFilters} className="text-xs text-red-500 font-medium hover:underline whitespace-nowrap">
                                Clear All
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Horizontal Sticky Filter Bar - Desktop only, mobile uses the sheet */}
            <div className="hidden md:flex sticky top-[115px] z-20 bg-white/95 backdrop-blur-xl border-b border-indigo-50 shadow-sm py-3 px-4 md:px-8 items-center gap-4 overflow-x-auto scrollbar-hide">
                <SidebarFilters
                    searchParams={searchParams}
                    toggleFilter={toggleFilter}
                    facets={facets}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    applyPriceRange={applyPriceRange}
                    selectedCategories={effectiveCategories ? effectiveCategories.split(',') : []}
                    orientation="horizontal"
                    updateFilter={updateFilter}
                />
            </div>

            <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 py-8">
                {/* Product Grid - Full Width, Editorial 3-Col */}
                <main className="min-h-screen">
                    {/* Quick Filter Tags & View Toggle Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        {/* Quick Tags */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {QUICK_FILTERS.map(({ tag, emoji, gradient, filter }) => (
                                <button
                                    key={tag}
                                    onClick={() => toggleFilter('tag', filter)}
                                    className={cn(
                                        "group px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap relative overflow-hidden shrink-0",
                                        searchParams.get('tag')?.includes(filter)
                                            ? `bg-gradient-to-r ${gradient} text-white border-transparent shadow-md`
                                            : "border-indigo-100 bg-white text-indigo-900 hover:border-indigo-300 hover:shadow-sm"
                                    )}
                                >
                                    {!searchParams.get('tag')?.includes(filter) && (
                                        <span className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                    )}
                                    <span className="relative flex items-center gap-1.5">
                                        <span className="">{emoji}</span>
                                        {tag}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* View Toggle - Hidden on mobile to save space */}
                        <div className="hidden sm:flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">View</span>
                            <div className="flex items-center border border-indigo-100 rounded-lg p-0.5 bg-white">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-7 w-7 rounded-md", viewMode === 'grid' ? "bg-indigo-50 text-indigo-900" : "text-indigo-400 hover:text-indigo-900")}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-7 w-7 rounded-md", viewMode === 'masonry' ? "bg-indigo-50 text-indigo-900" : "text-indigo-400 hover:text-indigo-900")}
                                    onClick={() => setViewMode('masonry')}
                                >
                                    <Grip className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-x-8 md:gap-y-16">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                                    <ProductCardSkeleton />
                                </div>
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="py-12 md:py-32 text-center border-2 border-dashed border-gray-100 rounded-xl md:rounded-3xl bg-gray-50/50 flex flex-col items-center justify-center px-4">
                            <div className="h-12 w-12 md:h-20 md:w-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 md:mb-6 text-2xl md:text-4xl">
                                🔍
                            </div>
                            <h2 className="text-base md:text-2xl font-serif font-bold text-gray-900 mb-2 md:mb-3">
                                {Array.from(searchParams.keys()).some(k => !['sort', 'page'].includes(k))
                                    ? "No matching products"
                                    : "No products found"}
                            </h2>
                            <p className="text-xs md:text-base text-gray-500 max-w-md mx-auto mb-4 md:mb-8">
                                {Array.from(searchParams.keys()).some(k => !['sort', 'page'].includes(k))
                                    ? "Try adjusting your filters or search for something else."
                                    : "We couldn't find any products in our catalog right now."}
                            </p>
                            {Array.from(searchParams.keys()).some(k => !['sort', 'page'].includes(k)) && (
                                <Button onClick={clearAllFilters} className="rounded-full px-4 md:px-8 h-9 md:h-12 text-[10px] md:text-sm font-bold uppercase tracking-wide">
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Pass everything to MasonryGrid which handles both layouts now */}
                            <MasonryGrid
                                products={Array.isArray(products) ? products : []}
                                viewMode={viewMode}
                            />
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

// Helper Component for Horizontal Filters
const FilterPopover = ({ label, active, children }: { label: string, active: boolean, children: React.ReactNode }) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn(
                "rounded-full border-dashed border-indigo-200 text-indigo-900 bg-transparent hover:bg-indigo-50 hover:border-indigo-300 text-xs font-bold uppercase tracking-wide h-8 px-4",
                active && "bg-indigo-900 text-white border-indigo-900 hover:bg-indigo-800 hover:border-indigo-800 border-solid"
            )}>
                {label} <ChevronDown className="ml-1.5 h-3 w-3 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
            {children}
        </PopoverContent>
    </Popover>
)

// Enhanced Filters Component (Horizontal & Sidebar)
function SidebarFilters({
    searchParams,
    toggleFilter,
    facets = { categories: {}, brands: {}, colors: {}, sizes: {} },
    priceRange,
    setPriceRange,
    applyPriceRange,
    selectedCategories,
    orientation = 'vertical',
    updateFilter,
    allCategories = []
}: {
    searchParams: any
    toggleFilter: (k: string, v: string) => void
    facets?: any
    priceRange: [number, number]
    setPriceRange: (range: [number, number]) => void
    applyPriceRange: () => void
    selectedCategories: string[]
    orientation?: 'horizontal' | 'vertical'
    updateFilter: (k: string, v: string | null) => void
    allCategories?: any[]
}) {
    // Shared Data Logic
    const mergedCategories = allCategories.map(c => ({
        value: c.slug,
        label: c.name,
        count: facets.categories?.[c.slug] || 0
    }))

    const dynamicBrands = Object.entries(facets.brands || {}).map(([key, count]) => ({
        value: key,
        label: key,
        count: count as number
    })).sort((a, b) => b.count - a.count)

    const AGE_OPTIONS = [
        { value: 'infant', label: '0-2 Years' },
        { value: 'toddler', label: '2-4 Years' },
        { value: 'kids', label: '4-12 Years' },
        { value: 'teen', label: '13-19 Years' },
        { value: 'adult', label: '20+ Years' }
    ]

    const selectedGenders = (searchParams.get('gender') || '').split(',').filter(Boolean)
    const selectedAges = (searchParams.get('age') || '').split(',').filter(Boolean)
    const selectedSizes = (searchParams.get('size') || '').split(',').filter(Boolean)
    const selectedBrands = (searchParams.get('brand') || '').split(',').filter(Boolean)
    const selectedColors = (searchParams.get('color') || '').split(',').filter(Boolean)
    const selectedDiscount = searchParams.get('discount')

    // --- HORIZONTAL MODE (Editorial) ---
    if (orientation === 'horizontal') {
        return (
            <div className="flex items-center gap-3">
                {/* Age Group */}
                <FilterPopover label="Age" active={selectedAges.length > 0}>
                    <div className="space-y-1 min-w-[160px]">
                        {AGE_OPTIONS.map(opt => (
                            <div key={opt.value} className="flex items-center gap-2 mb-2 last:mb-0">
                                <Checkbox
                                    id={`h-age-${opt.value}`}
                                    checked={selectedAges.includes(opt.value)}
                                    onCheckedChange={() => toggleFilter('age', opt.value)}
                                />
                                <Label htmlFor={`h-age-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
                            </div>
                        ))}
                    </div>
                </FilterPopover>

                {/* Gender */}
                <FilterPopover label="Gender" active={selectedGenders.length > 0}>
                    <div className="space-y-1 min-w-[160px]">
                        {GENDERS.map(g => (
                            <div key={g.value} className="flex items-center gap-2 mb-2 last:mb-0">
                                <Checkbox
                                    id={`h-g-${g.value}`}
                                    checked={selectedGenders.includes(g.value)}
                                    onCheckedChange={() => toggleFilter('gender', g.value)}
                                />
                                <Label htmlFor={`h-g-${g.value}`} className="text-sm cursor-pointer">{g.label}</Label>
                            </div>
                        ))}
                    </div>
                </FilterPopover>

                {/* Brand */}
                <FilterPopover label="Brand" active={selectedBrands.length > 0}>
                    <div className="space-y-1 max-h-64 overflow-y-auto w-[240px]">
                        {dynamicBrands.length === 0 && <div className="text-xs text-muted-foreground p-2">No brands available</div>}
                        {dynamicBrands.map(b => (
                            <div key={b.value} className="flex items-center gap-2 mb-2 last:mb-0">
                                <Checkbox
                                    id={`h-b-${b.value}`}
                                    checked={selectedBrands.includes(b.value)}
                                    onCheckedChange={() => toggleFilter('brand', b.value)}
                                />
                                <Label htmlFor={`h-b-${b.value}`} className="text-sm cursor-pointer flex-1 truncate">{b.label}</Label>
                                <span className="text-xs text-indigo-300">({b.count})</span>
                            </div>
                        ))}
                    </div>
                </FilterPopover>

                {/* Category */}
                <FilterPopover label="Category" active={selectedCategories.length > 0}>
                    <div className="space-y-2 max-h-64 overflow-y-auto w-[240px]">
                        {mergedCategories.slice(0, 15).map(c => (
                            <div key={c.value} className="flex items-center gap-3">
                                <Checkbox id={`h-c-${c.value}`} checked={selectedCategories.includes(c.value)} onCheckedChange={() => toggleFilter('category', c.value)} />
                                <Label htmlFor={`h-c-${c.value}`} className="text-sm cursor-pointer flex-1 truncate">{c.label}</Label>
                                <span className="text-xs text-indigo-300">({c.count})</span>
                            </div>
                        ))}
                    </div>
                </FilterPopover>

                {/* Size */}
                <FilterPopover label="Size" active={selectedSizes.length > 0}>
                    <div className="grid grid-cols-4 gap-2 w-[200px]">
                        {SIZES.map(s => (
                            <button
                                key={s.value}
                                onClick={() => toggleFilter('size', s.value)}
                                className={cn(
                                    "h-9 rounded-md border text-xs font-bold transition-all",
                                    selectedSizes.includes(s.value) ? "bg-indigo-900 text-white border-indigo-900" : "border-indigo-100 hover:border-indigo-300 text-indigo-900"
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </FilterPopover>

                {/* Color */}
                <FilterPopover label="Color" active={selectedColors.length > 0}>
                    <div className="grid grid-cols-2 gap-2 w-[240px]">
                        {COLORS.map(c => (
                            <button
                                key={c.value}
                                onClick={() => toggleFilter('color', c.value)}
                                className={cn(
                                    "flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-50 transition-all text-xs font-medium",
                                    selectedColors.includes(c.value) ? "bg-gray-50 ring-1 ring-black" : ""
                                )}
                            >
                                <div
                                    className="h-4 w-4 rounded-full border shadow-sm relative shrink-0"
                                    style={{ background: c.hex }}
                                >
                                    {c.value === 'white' && <div className="absolute inset-0 rounded-full border border-gray-200" />}
                                </div>
                                <span className="text-gray-700 capitalize">{c.label}</span>
                            </button>
                        ))}
                    </div>
                </FilterPopover>

                {/* Price */}
                <FilterPopover label="Price" active={priceRange[0] > 0 || priceRange[1] < 10000}>
                    <div className="w-[240px] px-2 py-2">
                        <div className="flex justify-between text-sm font-bold text-indigo-900 mb-4">
                            <span>₹{priceRange[0]}</span>
                            <span>₹{priceRange[1]}+</span>
                        </div>
                        <Slider
                            defaultValue={[0, 10000]}
                            value={[priceRange[0], priceRange[1]]}
                            max={10000}
                            step={500}
                            onValueChange={(val) => setPriceRange([val[0], val[1]])}
                            onValueCommit={applyPriceRange}
                            className="mb-4"
                        />
                        <Button size="sm" className="w-full bg-indigo-900 hover:bg-indigo-800" onClick={applyPriceRange}>
                            Apply Price
                        </Button>
                    </div>
                </FilterPopover>

                {/* Rating (New) */}
                <FilterPopover label="Rating" active={!!searchParams.get('rating')}>
                    <div className="space-y-1 w-[160px]">
                        {[4, 3, 2].map((r) => (
                            <button
                                key={r}
                                onClick={() => updateFilter('rating', searchParams.get('rating') === r.toString() ? null : r.toString())}
                                className={cn(
                                    "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-gray-50 transition-colors",
                                    searchParams.get('rating') === r.toString() && "bg-indigo-50 font-medium text-indigo-900"
                                )}
                            >
                                <div className="flex items-center text-amber-400">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={cn("h-3.5 w-3.5", i < r ? "fill-current" : "text-gray-200")} />
                                    ))}
                                </div>
                                <span className="text-gray-600">& Up</span>
                            </button>
                        ))}
                    </div>
                </FilterPopover>

                {/* Status (In Stock) */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilter('inStock', searchParams.get('inStock') === 'true' ? null : 'true')}
                    className={cn(
                        "rounded-full border-dashed border-indigo-200 text-indigo-900 bg-transparent hover:bg-indigo-50 hover:border-indigo-300 text-xs font-bold uppercase tracking-wide h-8 px-4",
                        searchParams.get('inStock') === 'true' && "bg-indigo-900 text-white border-indigo-900 hover:bg-indigo-800 hover:border-indigo-800 border-solid"
                    )}
                >
                    {searchParams.get('inStock') === 'true' && <span className="mr-1.5 text-xs">✓</span>}
                    In Stock
                </Button>
            </div>
        )
    }

    // --- VERTICAL MODE (Mobile Sheet) ---
    return (
        <Accordion type="multiple" defaultValue={['status', 'rating', 'gender', 'categories', 'size', 'color', 'price']} className="w-full space-y-1">
            {/* Status (In Stock) */}
            <div className="border rounded-lg px-3 py-3 mb-2 flex items-center justify-between">
                <Label htmlFor="v-instock" className="font-semibold text-sm">In Stock Only</Label>
                <Switch
                    id="v-instock"
                    checked={searchParams.get('inStock') === 'true'}
                    onCheckedChange={(checked) => updateFilter('inStock', checked ? 'true' : null)}
                />
            </div>

            {/* Rating */}
            <AccordionItem value="rating" className="border rounded-lg px-3 mb-2">
                <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Rating</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-1 pb-3">
                        {[4, 3, 2].map((r) => (
                            <button
                                key={r}
                                onClick={() => updateFilter('rating', searchParams.get('rating') === r.toString() ? null : r.toString())}
                                className={cn(
                                    "flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm hover:bg-gray-50 transition-colors",
                                    searchParams.get('rating') === r.toString() && "bg-indigo-50 font-medium text-indigo-900"
                                )}
                            >
                                <div className="flex items-center text-amber-400">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={cn("h-4 w-4", i < r ? "fill-current" : "text-gray-200")} />
                                    ))}
                                </div>
                                <span className="text-gray-600">& Up</span>
                            </button>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Age Group */}
            <AccordionItem value="age" className="border rounded-lg px-3 mb-2">
                <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Age Group</AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 pb-3">
                        {AGE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => toggleFilter('age', opt.value)}
                                className={cn(
                                    "flex items-center justify-center px-3 py-2 rounded-lg border text-xs font-medium transition-all text-center h-10",
                                    selectedAges.includes(opt.value)
                                        ? "border-indigo-950 bg-indigo-950 text-white"
                                        : "border-gray-200 hover:border-gray-400 text-gray-700"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Gender */}
            <AccordionItem value="gender" className="border rounded-lg px-3 mb-2">

                <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Gender</AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 pb-3">
                        {GENDERS.map(g => (
                            <button
                                key={g.value}
                                onClick={() => toggleFilter('gender', g.value)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                                    selectedGenders.includes(g.value)
                                        ? "border-indigo-950 bg-indigo-950 text-white"
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <span>{g.icon}</span>
                                <span>{g.label}</span>
                            </button>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Categories */}
            {mergedCategories.length > 0 && (
                <AccordionItem value="categories" className="border rounded-lg px-3 mb-2">
                    <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Category</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pb-3 max-h-48 overflow-y-auto">
                            {mergedCategories.slice(0, 15).map(c => (
                                <div key={c.value} className="flex items-center gap-3">
                                    <Checkbox
                                        id={`c-${c.value}`}
                                        checked={selectedCategories.includes(c.value)}
                                        onCheckedChange={() => toggleFilter('category', c.value)}
                                    />
                                    <Label htmlFor={`c-${c.value}`} className="text-sm cursor-pointer flex-1">{c.label}</Label>
                                    <span className="text-xs text-muted-foreground">({c.count})</span>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}

            {/* Size */}
            <AccordionItem value="size" className="border rounded-lg px-3 mb-2">
                <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Size</AccordionTrigger>
                <AccordionContent>
                    <div className="flex flex-wrap gap-2 pb-3">
                        {SIZES.map(s => (
                            <button
                                key={s.value}
                                onClick={() => toggleFilter('size', s.value)}
                                className={cn(
                                    "min-w-[40px] h-10 px-3 rounded-lg border text-sm font-medium transition-all",
                                    selectedSizes.includes(s.value)
                                        ? "border-black bg-black text-white"
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Color */}
            <AccordionItem value="color" className="border rounded-lg px-3 mb-2">
                <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Color</AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 pb-3">
                        {COLORS.map(c => (
                            <button
                                key={c.value}
                                onClick={() => toggleFilter('color', c.value)}
                                className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg border transition-all text-sm",
                                    selectedColors.includes(c.value)
                                        ? "border-black bg-gray-50 ring-1 ring-black"
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                <div
                                    className="h-5 w-5 rounded-full border shadow-sm relative shrink-0"
                                    style={{ background: c.hex }}
                                >
                                    {c.value === 'white' && <div className="absolute inset-0 rounded-full border border-gray-200" />}
                                </div>
                                <span className="text-gray-700 font-medium capitalize">{c.label}</span>
                            </button>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Brand */}
            {dynamicBrands.length > 0 && (
                <AccordionItem value="brand" className="border rounded-lg px-3 mb-2">
                    <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Brand</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pb-3 max-h-48 overflow-y-auto">
                            {dynamicBrands.map((b) => (
                                <div key={b.value} className="flex items-center gap-3">
                                    <Checkbox
                                        id={`v-b-${b.value}`}
                                        checked={selectedBrands.includes(b.value)}
                                        onCheckedChange={() => toggleFilter('brand', b.value)}
                                    />
                                    <Label htmlFor={`v-b-${b.value}`} className="text-sm cursor-pointer flex-1 capitalize">
                                        {b.label}
                                    </Label>
                                    <span className="text-xs text-muted-foreground">({b.count})</span>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}

            {/* Price Range */}
            <AccordionItem value="price" className="border rounded-lg px-3 mb-2">
                <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Price Range</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 pb-3">
                        <Slider
                            value={priceRange}
                            onValueChange={(v) => setPriceRange(v as [number, number])}
                            min={0}
                            max={10000}
                            step={100}
                            className="w-full"
                        />
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={priceRange[0]}
                                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                                className="w-full h-9 text-center text-sm"
                                placeholder="Min"
                            />
                            <span className="text-gray-400">-</span>
                            <Input
                                type="number"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                                className="w-full h-9 text-center text-sm"
                                placeholder="Max"
                            />
                        </div>
                        <Button onClick={applyPriceRange} size="sm" className="w-full">Apply</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Dynamic Facets: Pattern, Occasion, Sleeve, Neck, Fit, Material */}
            {[
                { key: 'patterns', label: 'Pattern', param: 'pattern' },
                { key: 'occasions', label: 'Occasion', param: 'occasion' },
                { key: 'sleeves', label: 'Sleeve Length', param: 'sleeve' },
                { key: 'necks', label: 'Neck Type', param: 'neck' },
                { key: 'fits', label: 'Fit', param: 'fit' },
                { key: 'materials', label: 'Material', param: 'material' }
            ].map((facet) => {
                const options = Object.entries(facets[facet.key] || {})
                    .map(([value, count]) => ({ value, count: count as number, label: value }))
                    .sort((a, b) => b.count - a.count)

                if (options.length === 0) return null

                const selected = (searchParams.get(facet.param) || '').split(',').filter(Boolean)

                return (
                    <AccordionItem key={facet.key} value={facet.key} className="border rounded-lg px-3 mb-2">
                        <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">{facet.label}</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2 pb-3 max-h-48 overflow-y-auto">
                                {options.slice(0, 10).map((opt) => (
                                    <div key={opt.value} className="flex items-center gap-3">
                                        <Checkbox
                                            id={`${facet.key}-${opt.value}`}
                                            checked={selected.includes(opt.value)}
                                            onCheckedChange={() => toggleFilter(facet.param, opt.value)}
                                        />
                                        <Label htmlFor={`${facet.key}-${opt.value}`} className="text-sm cursor-pointer flex-1 capitalize">
                                            {opt.value}
                                        </Label>
                                        <span className="text-xs text-muted-foreground">({opt.count})</span>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}

            {/* Discount */}
            <AccordionItem value="discount" className="border rounded-lg px-3 mb-2">
                <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Discount</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-2 pb-3">
                        {DISCOUNTS.map(d => (
                            <div key={d.value} className="flex items-center gap-3">
                                <Checkbox
                                    id={`d-${d.value}`}
                                    checked={selectedDiscount === d.value}
                                    onCheckedChange={() => toggleFilter('discount', d.value)}
                                />
                                <Label htmlFor={`d-${d.value}`} className="text-sm cursor-pointer">{d.label}</Label>
                            </div>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Brands */}
            {dynamicBrands.length > 0 && (
                <AccordionItem value="brands" className="border rounded-lg px-3 mb-2">
                    <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Brand</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pb-3 max-h-48 overflow-y-auto">
                            {dynamicBrands.slice(0, 15).map(b => (
                                <div key={b.value} className="flex items-center gap-3">
                                    <Checkbox
                                        id={`b-${b.value}`}
                                        checked={selectedBrands.includes(b.value)}
                                        onCheckedChange={() => toggleFilter('brand', b.value)}
                                    />
                                    <Label htmlFor={`b-${b.value}`} className="text-sm cursor-pointer flex-1">{b.label}</Label>
                                    <span className="text-xs text-muted-foreground">({b.count})</span>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}

            {/* Material */}
            <AccordionItem value="material" className="border rounded-lg px-3 mb-2">
                <AccordionTrigger className="py-3 hover:no-underline font-semibold text-sm">Material</AccordionTrigger>
                <AccordionContent>
                    <div className="flex flex-wrap gap-2 pb-3">
                        {MATERIALS.map(m => (
                            <button
                                key={m.value}
                                onClick={() => toggleFilter('material', m.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full border text-sm transition-all",
                                    (searchParams.get('material') || '').split(',').includes(m.value)
                                        ? "border-black bg-black text-white"
                                        : "border-gray-200 hover:border-gray-400"
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
