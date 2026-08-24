'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Category, CategoryWithSubs } from '@/lib/categories/types'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
// Types from CMS
export type MenuItem = {
    id: string
    label: string
    url: string
    type: 'link' | 'category' | 'promo'
    badge?: string
    children?: MenuItem[]
}

interface MegaMenuProps {
    categories: Category[] | CategoryWithSubs[] | MenuItem[]
}

// Type Guards
function isCategoryWithSubs(item: any): item is CategoryWithSubs {
    return 'sub_categories' in item
}

function isMenuItem(item: any): item is MenuItem {
    return 'type' in item && 'label' in item
}

export function MegaMenu({ categories }: MegaMenuProps) {
    const VISIBLE_COUNT = 6

    // Handle both old and new category formats
    const activeCategories = categories.filter((c: any) => {
        if (isMenuItem(c)) return true
        return c.is_active
    })
    const visibleCategories = activeCategories.slice(0, VISIBLE_COUNT)
    const hiddenCategories = activeCategories.slice(VISIBLE_COUNT)

    return (
        <nav className="hidden md:flex items-center h-full gap-0.5">
            {visibleCategories.map((item: any) => {
                // Determine properties based on type
                let id, name, url, children, hasChildren

                if (isMenuItem(item)) {
                    id = item.id
                    name = item.label
                    url = item.url
                    children = item.children || []
                    hasChildren = children.length > 0
                } else {
                    // Legacy Category logic
                    id = item.id
                    name = item.name
                    url = `/shop/${item.slug}`
                    children = isCategoryWithSubs(item) ? item.sub_categories : (item.children || [])
                    hasChildren = children && children.length > 0
                }

                return (
                    <div key={id} className="group h-full flex items-center relative">
                        <Link
                            href={url}
                            className={cn(
                                "px-3 lg:px-4 h-full flex items-center gap-1 text-sm font-bold tracking-wide text-foreground/80 hover:text-foreground transition-colors uppercase cursor-pointer whitespace-nowrap group",
                                "border-b-[3px] border-transparent hover:border-[#ff3f6c]"
                            )}
                        >
                            {name}
                            {isMenuItem(item) && item.badge && (
                                <span className="ml-1 text-[10px] bg-[#ff3f6c] text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>
                            )}
                            {hasChildren && (
                                <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                            )}
                        </Link>

                        {/* Mega Menu Dropdown */}
                        {hasChildren && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-[500px] bg-white border shadow-2xl rounded-b-2xl py-6 px-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                {/* Flexible Layout based on Child Type */}
                                <div className="flex gap-6">
                                    <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1">
                                        {children.map((child: any) => {
                                            const childName = isMenuItem(child) ? child.label : child.name
                                            const childUrl = isMenuItem(child) ? child.url : `/shop/${item.slug}/${child.slug}` // Note: Category logic fallback might be flaky if mixed
                                            const childIcon = (child as any).icon

                                            return (
                                                <Link
                                                    key={child.id || childName}
                                                    href={childUrl}
                                                    className="group/item flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="text-lg">{childIcon || '•'}</span>
                                                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-[#ff3f6c] transition-colors">
                                                        {childName}
                                                        {isMenuItem(child) && child.badge && (
                                                            <span className="ml-2 text-[10px] bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded-full group-hover/item:bg-[#ff3f6c] group-hover/item:text-white transition-colors">{child.badge}</span>
                                                        )}
                                                    </span>
                                                </Link>
                                            )
                                        })}
                                    </div>

                                    {/* Image Logic (Only for Legacy Categories or specific CMS metadata if added later) */}
                                    {!isMenuItem(item) && isCategoryWithSubs(item) && item.image_url && (
                                        <div className="w-36 h-36 rounded-xl overflow-hidden relative shrink-0">
                                            <Image
                                                src={item.image_url}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                            <span className="absolute bottom-2 left-2 text-white text-xs font-bold uppercase">
                                                {item.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}


            {/* MORE Dropdown */}
            {hiddenCategories.length > 0 && (
                <div className="group h-full flex items-center relative">
                    <button className="px-3 lg:px-4 h-full flex items-center gap-1 text-sm font-bold tracking-wide text-[#ff3f6c] hover:text-[#d63559] transition-colors uppercase cursor-pointer whitespace-nowrap">
                        More
                        <ChevronDown className="h-3 w-3" />
                    </button>

                    <div className="absolute right-0 top-full w-[200px] bg-white border shadow-xl py-2 rounded-b-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        {hiddenCategories.map((cat: any) => {
                            const name = isMenuItem(cat) ? cat.label : cat.name
                            const url = isMenuItem(cat) ? cat.url : `/shop/${cat.slug}`

                            return (
                                <Link
                                    key={cat.id || name}
                                    href={url}
                                    className="block px-4 py-3 text-sm font-medium hover:bg-gray-50 text-foreground/80 hover:text-[#ff3f6c] transition-colors"
                                >
                                    {name}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}
        </nav>
    )
}

// Compact version for mobile header
export function MegaMenuMobile({ categories }: MegaMenuProps) {
    return (
        <div className="flex overflow-x-auto scrollbar-hide gap-1 px-4 py-2 bg-white border-b">
            {categories.filter((c: any) => isMenuItem(c) || c.is_active).map((category: any) => {
                const name = isMenuItem(category) ? category.label : category.name
                const url = isMenuItem(category) ? category.url : `/shop/${category.slug}`

                return (
                    <Link
                        key={category.id || name}
                        href={url}
                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-[#ff3f6c] whitespace-nowrap rounded-full border border-gray-200 hover:border-[#ff3f6c] transition-colors"
                    >
                        {name}
                    </Link>
                )
            })}
        </div>
    )
}
