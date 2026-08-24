'use client'

import { useEffect, useState } from 'react'
import { useTryOnEngine, TryOnAsset } from '@/lib/try-on'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RotateCcw, Shirt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'

const MOCK_CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear']

export function TryOnControls() {
    const { activeCategory, setCategory, equip, reset } = useTryOnEngine()
    const [closetItems, setClosetItems] = useState<any[]>([])
    const searchParams = useSearchParams()

    // Handle URL Product ID
    useEffect(() => {
        const productId = searchParams.get('product_id')
        if (productId) {
            // Simulate fetching product details (In real app, fetch from DB)
            // For MVP, if it's a demo ID, load demo.
            console.log("Loading product from URL:", productId)
            // Temporary: Just load a demo top to prove it works
            applyDemoItem('Tops')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    // Fetch Closet
    useEffect(() => {
        const fetchCloset = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('user_closet_items')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                setClosetItems(data || [])
            }
        }
        fetchCloset()
    }, [])

    const applyDemoItem = (category: string) => {
        let demoUrl = 'https://via.placeholder.com/500x500/transparent/000000?text=Top'
        let layer = 2
        if (category === 'Bottoms') {
            demoUrl = 'https://via.placeholder.com/500x500/transparent/000000?text=Pants'
            layer = 1
        }

        const asset: TryOnAsset = {
            id: Math.random(),
            url: demoUrl,
            layer,
            type: 'demo'
        }
        equip(asset)
    }

    const applyClosetItem = (item: any) => {
        let layer = 2
        if (item.category === 'bottoms') layer = 1
        if (item.category === 'shoes') layer = 0

        const asset: TryOnAsset = {
            id: item.id,
            url: item.processed_image_url || item.image_url,
            layer,
            type: 'closet'
        }
        equip(asset)
    }

    return (
        <div className="w-80 border-r bg-white dark:bg-black p-4 flex flex-col gap-4 z-10 shadow-xl h-full">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black font-bold">
                    FM
                </div>
                <h1 className="font-bold text-lg tracking-tight">Try-On Studio</h1>
            </div>

            <Tabs value={activeCategory} onValueChange={setCategory} className="flex-1 flex flex-col">
                <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="closet" className="text-xs font-bold text-indigo-600">My Closet</TabsTrigger>
                    {MOCK_CATEGORIES.map(cat => (
                        <TabsTrigger key={cat} value={cat} className="text-xs">{cat}</TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex-1 overflow-y-auto min-h-0 relative">
                    {/* Dynamic Content based on Category */}
                    {activeCategory === 'closet' ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {closetItems.length === 0 && (
                                <div className="col-span-2 text-center text-xs text-muted-foreground py-10">
                                    No items found. Upload in Profile!
                                </div>
                            )}
                            {closetItems.map((item) => (
                                <Card
                                    key={item.id}
                                    onClick={() => applyClosetItem(item)}
                                    className="aspect-[3/4] bg-neutral-100 dark:bg-neutral-800 border-none cursor-pointer hover:ring-2 ring-indigo-500 transition-all group relative overflow-hidden"
                                >
                                    <Image src={item.image_url} alt="Closet Item" fill className="object-cover" />
                                    {!item.processed && <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full" />}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <Card
                                    key={i}
                                    onClick={() => applyDemoItem(activeCategory)}
                                    className="aspect-[3/4] bg-neutral-100 dark:bg-neutral-800 border-none cursor-pointer hover:ring-2 ring-black transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                                        <Shirt size={24} />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] text-white text-center">Click to Try</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Tabs>

            <div className="border-t pt-4 mt-auto">
                <Button variant="outline" className="w-full gap-2" onClick={reset}>
                    <RotateCcw size={16} />
                    Reset Outfit
                </Button>
            </div>
        </div>
    )
}
