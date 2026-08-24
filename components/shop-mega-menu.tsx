'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Fallback if no DB data
const FALLBACK_MENU = [
    { label: 'Men', href: '/shop/men', columns: [] },
    { label: 'Women', href: '/shop/women', columns: [] }
]

interface MegaMenuProps {
    menuData?: any[]
}

export function ShopMegaMenu({ menuData = [] }: MegaMenuProps) {
    const data = (menuData && menuData.length > 0) ? menuData : FALLBACK_MENU
    const [activeMenu, setActiveMenu] = React.useState<string | null>(null)

    return (
        <div className="h-full flex items-center" onMouseLeave={() => setActiveMenu(null)}>
            {data.map((menu: any) => (
                <div
                    key={menu.label}
                    className="group h-full flex items-center relative px-4 lg:px-5"
                    onMouseEnter={() => setActiveMenu(menu.label)}
                >
                    <Link
                        href={menu.href}
                        className={cn(
                            "h-full flex items-center gap-1 text-[13px] font-bold tracking-widest text-foreground/70 hover:text-foreground transition-colors uppercase cursor-pointer whitespace-nowrap border-b-[2px] border-transparent",
                            activeMenu === menu.label ? "border-black text-black" : ""
                        )}
                    >
                        {menu.label}
                    </Link>

                    {/* Premium Full Width Dropdown */}
                    <div
                        className={cn(
                            "fixed left-0 right-0 top-[var(--header-height,64px)] bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out origin-top z-50",
                            activeMenu === menu.label
                                ? "opacity-100 visible translate-y-0"
                                : "opacity-0 invisible -translate-y-2 pointer-events-none"
                        )}
                        style={{ height: '400px' }}
                    >
                        <div className="container mx-auto h-full px-8 py-10">
                            <div className="grid grid-cols-12 gap-12 h-full">

                                {/* Left Side: Featured / Hero (Visual) - Col 1-3 */}
                                <div className="col-span-3 relative h-full rounded-lg overflow-hidden group/card">
                                    <Image
                                        src={menu.featured?.image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop"}
                                        alt={menu.label}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/10 transition-colors" />
                                    <div className="absolute bottom-6 left-6 text-white">
                                        <p className="font-serif text-2xl mb-2">{menu.label} Collection</p>
                                        <p className="text-sm font-medium tracking-wide opacity-90 mb-4">{menu.featured?.text || "Explore the New Season"}</p>
                                        <Link href={menu.href} className="inline-block bg-white text-black px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                                            View All
                                        </Link>
                                    </div>
                                </div>

                                {/* Middle: Categories Grid - Col 4-9 */}
                                <div className="col-span-6 grid grid-cols-3 gap-y-8 gap-x-4 content-start">
                                    {menu.columns?.map((col: any, idx: number) => (
                                        <div key={idx} className="space-y-4">
                                            <h3 className="font-bold text-black text-sm uppercase tracking-widest border-b border-gray-100 pb-2">
                                                {col.heading}
                                            </h3>
                                            <ul className="space-y-2.5">
                                                {col.items?.slice(0, 6).map((item: string) => (
                                                    <li key={item}>
                                                        <Link
                                                            href={`${menu.href}?q=${item}`}
                                                            className="text-gray-500 hover:text-black text-[13px] font-medium transition-colors block hover:translate-x-1 duration-200"
                                                        >
                                                            {item}
                                                        </Link>
                                                    </li>
                                                ))}
                                                {col.items?.length > 6 && (
                                                    <li>
                                                        <Link href={menu.href} className="text-xs font-bold underline decoration-gray-300 hover:decoration-black text-gray-400 hover:text-black">
                                                            View all
                                                        </Link>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>

                                {/* Right: Trending / Editor's Pick (Visual Text) - Col 10-12 */}
                                <div className="col-span-3 border-l border-gray-100 pl-10 flex flex-col justify-center space-y-6">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Trending Now</h4>
                                        <ul className="space-y-3">
                                            {['New Arrivals', 'Best Sellers', 'Editor\'s Pick', 'Sale'].map((tag) => (
                                                <li key={tag}>
                                                    <Link href={`${menu.href}?sort=new`} className="text-lg font-serif text-gray-800 hover:text-amber-600 italic transition-colors">
                                                        {tag}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="pt-6">
                                        <div className="bg-amber-50 p-4 rounded text-center">
                                            <p className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">Special Offer</p>
                                            <p className="text-2xl font-serif text-amber-900 mb-2">Flat 20% Off</p>
                                            <p className="text-xs text-amber-700/80 mb-3">Use Code: FIRST20</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
