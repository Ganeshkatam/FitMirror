'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Eye, Heart, Shirt } from 'lucide-react'

export function VirtualWardrobe({ items = [] }: { items?: any[] }) {
    const WARDROBE_ITEMS = items.length > 0 ? items : []

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                        <Shirt className="h-5 w-5 text-pink-500" />
                        Virtual Wardrobe
                    </h3>
                    <p className="text-sm text-gray-500">Manage your digital collection</p>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <div className="px-6 pt-4">
                    <TabsList className="bg-gray-100/50">
                        <TabsTrigger value="all">All Items</TabsTrigger>
                        <TabsTrigger value="ordered">Purchased</TabsTrigger>
                        <TabsTrigger value="tried">Tried On</TabsTrigger>
                        <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-6">
                    <TabsContent value="all" className="mt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {WARDROBE_ITEMS.map(item => (
                                <WardrobeItem key={item.id} item={item} />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="ordered" className="mt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {WARDROBE_ITEMS.filter(i => i.status === 'ordered').map(item => (
                                <WardrobeItem key={item.id} item={item} />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="tried" className="mt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {WARDROBE_ITEMS.filter(i => i.status === 'tried').map(item => (
                                <WardrobeItem key={item.id} item={item} />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="wishlist" className="mt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {WARDROBE_ITEMS.filter(i => i.status === 'wishlist').map(item => (
                                <WardrobeItem key={item.id} item={item} />
                            ))}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function WardrobeItem({ item }: { item: any }) {
    return (
        <div className="group relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer">
            <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Status Badge */}
            <div className="absolute top-2 left-2">
                {item.status === 'ordered' && <span className="bg-green-500/90 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Bought</span>}
                {item.status === 'tried' && <span className="bg-indigo-500/90 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1"><Eye className="w-3 h-3" /> Tried</span>}
                {item.status === 'wishlist' && <span className="bg-pink-500/90 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1"><Heart className="w-3 h-3 fill-current" /> Liked</span>}
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white font-medium text-sm truncate">{item.name}</p>
                <p className="text-white/70 text-xs">{item.date}</p>
            </div>
        </div>
    )
}
