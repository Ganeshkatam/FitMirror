'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Shirt, Scissors, Footprints, Ruler } from 'lucide-react'
import { useTryOnStore } from '@/lib/store/use-try-on'
import { cn } from '@/lib/utils'

const CATEGORIES = [
    { id: 'top', icon: Shirt, label: 'Tops' },
    { id: 'bottom', icon: Scissors, label: 'Bottoms' }, // Using Scissors as pants icon placeholder
    { id: 'shoes', icon: Footprints, label: 'Shoes' },
    { id: 'config', icon: Ruler, label: 'Body' },
]

const SKIN_TONES = [
    '#FFDFC4', // Very Light
    '#F5D0C5', // Light
    '#D4A574', // Medium Light
    '#C68642', // Medium
    '#8D5524', // Medium Dark
    '#5C3A21', // Dark
]

function BodyConfigPanel() {
    const { avatarConfig, setAvatarConfig } = useTryOnStore()

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
            {/* Height Slider */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Height</label>
                    <span className="text-sm text-muted-foreground font-mono">{avatarConfig.height} cm</span>
                </div>
                <Slider
                    value={[avatarConfig.height]}
                    onValueChange={([val]) => setAvatarConfig({ height: val })}
                    min={150}
                    max={200}
                    step={1}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>150cm</span>
                    <span>200cm</span>
                </div>
            </div>

            {/* Weight Slider */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Weight</label>
                    <span className="text-sm text-muted-foreground font-mono">{avatarConfig.weight} kg</span>
                </div>
                <Slider
                    value={[avatarConfig.weight]}
                    onValueChange={([val]) => setAvatarConfig({ weight: val })}
                    min={40}
                    max={120}
                    step={1}
                    className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>40kg</span>
                    <span>120kg</span>
                </div>
            </div>

            {/* Skin Tone Picker */}
            <div className="space-y-3">
                <label className="text-sm font-medium">Skin Tone</label>
                <div className="flex gap-2">
                    {SKIN_TONES.map((tone) => (
                        <button
                            key={tone}
                            className={cn(
                                "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
                                avatarConfig.skinTone === tone ? "border-black ring-2 ring-offset-2 ring-black" : "border-transparent"
                            )}
                            style={{ backgroundColor: tone }}
                            onClick={() => setAvatarConfig({ skinTone: tone })}
                        />
                    ))}
                </div>
            </div>

            {/* Gender Toggle */}
            <div className="space-y-3">
                <label className="text-sm font-medium">Body Type</label>
                <div className="flex gap-2">
                    <Button
                        variant={avatarConfig.gender === 'female' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setAvatarConfig({ gender: 'female' })}
                    >
                        Female
                    </Button>
                    <Button
                        variant={avatarConfig.gender === 'male' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setAvatarConfig({ gender: 'male' })}
                    >
                        Male
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function GarmentSelector() {
    const [items, setItems] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState('top')
    const { setSelectedItem } = useTryOnStore()

    React.useEffect(() => {
        const fetchItems = async () => {
            if (activeTab === 'config') return

            setLoading(true)
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()

            let query = supabase
                .from('products')
                .select('id, name, image_url, price, category')
                .eq('is_active', true)
                .neq('image_url', null)


            // Flexible Category Matching
            if (activeTab === 'top') {
                query = query.textSearch('category', "'tops' | 'dresses' | 'shirts' | 'jackets' | 'outerwear'", { config: 'english', type: 'plain' })
            } else if (activeTab === 'bottom') {
                // Using 'plain' type allows loose matching but 'websearch' or custom config might be better if we want suffix matching.
                // However, textSearch is full-text. Simple ILIKE OR might be safer if FTS isn't set up.
                // Let's try the safest .or with simplified syntax that definitely works in JS client.

                // Actually, the previous error might be due to spaces or missing quotes.
                // Let's use a known working pattern: .ilike('category', '%bottom%') etc.
                // But we can't chain .or() easily for one column without the big string.

                // Alternative: filtering in memory? No, pagination.

                // Let's try the exact syntax:
                query = query.or(`category.ilike.%bottom%,category.ilike.%pant%,category.ilike.%jean%,category.ilike.%skirt%`)
            } else if (activeTab === 'shoes') {
                query = query.or(`category.ilike.%shoe%,category.ilike.%sneaker%,category.ilike.%boot%`)
            }

            const { data, error } = await query.limit(20)
            if (error) {
                console.error('GarmentSelector Error:', error)
            } else {
                console.log('GarmentSelector Data:', activeTab, data)
            }
            if (data) setItems(data)
            setLoading(false)
        }
        fetchItems()
    }, [activeTab])

    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 md:bg-white/90 md:backdrop-blur-lg border-t h-[35vh] md:h-[300px] flex flex-col shadow-[0_-5px_30px_rgba(0,0,0,0.1)] rounded-t-3xl md:rounded-none z-10"
            data-testid="garment-selector"
        >
            {/* Categories Navigation */}
            <div className="flex items-center justify-center gap-2 p-4 border-b bg-white/50">
                {CATEGORIES.map(cat => (
                    <Button
                        key={cat.id}
                        variant={activeTab === cat.id ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab(cat.id)}
                        className={cn(
                            "rounded-full px-6 transition-all",
                            activeTab === cat.id ? "bg-black text-white hover:bg-gray-800" : "text-gray-500 hover:text-black"
                        )}
                    >
                        <cat.icon className="h-4 w-4 mr-2" />
                        {cat.label}
                    </Button>
                ))}
            </div>

            {/* Items Content */}
            <ScrollArea className="flex-1 bg-white/50">
                <div className="p-6">
                    {activeTab === 'config' ? (
                        <BodyConfigPanel />
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                            {loading ? (
                                <div className="col-span-3 text-center py-8 text-muted-foreground">Loading...</div>
                            ) : items.length === 0 ? (
                                <div className="col-span-3 text-center py-8 text-muted-foreground">No items found in this category.</div>
                            ) : (
                                items.map((item) => (
                                    <button
                                        key={item.id}
                                        className="group relative aspect-[3/4] rounded-xl border-2 border-transparent bg-gray-100 hover:border-black overflow-hidden transition-all"
                                        onClick={() => setSelectedItem(activeTab === 'shoes' ? 'shoes' : activeTab === 'bottom' ? 'bottom' : 'top', item.id)}
                                    >
                                        {item.image_url ? (
                                            <Image
                                                src={item.image_url}
                                                alt={item.name}
                                                className="absolute inset-0 object-cover"
                                                fill
                                                sizes="(max-width: 768px) 33vw, 20vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                👕
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                            <div className="text-[10px] font-bold text-white text-center truncate">
                                                {item.name}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </motion.div>
    )
}
