'use client'

import { useState } from 'react'
import Image from 'next/image'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Share2, Save, ShoppingBag, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export function OutfitBuilderClient({ wardrobe, recommendations }: { wardrobe: any[], recommendations: any[] }) {
    const [outfit, setOutfit] = useState<{ top: any, bottom: any, shoes: any }>({ top: null, bottom: null, shoes: null })

    const handleSelect = (item: any, type: 'top' | 'bottom' | 'shoes') => {
        setOutfit(prev => ({ ...prev, [type]: item }))
    }

    const handleSave = () => {
        toast.success("Outfit saved to your closet!")
    }

    return (
        <div className="container px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold">Outfit Builder</h1>
                    <p className="text-muted-foreground">Mix & match to discover your style</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setOutfit({ top: null, bottom: null, shoes: null })}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                        <Save className="mr-2 h-4 w-4" /> Save Look
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* CANVAS */}
                <div className="lg:col-span-5 order-2 lg:order-1">
                    <Card className="h-[600px] bg-white shadow-xl border-dashed border-2 flex flex-col items-center justify-center relative p-8 gap-4">
                        {/* Top Slot */}
                        <div className="w-48 h-56 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-50 relative group">
                            {outfit.top ? (
                                <div className="relative w-full h-full p-2 cursor-pointer" onClick={() => handleSelect(null, 'top')}>
                                    <Image src={outfit.top.image || outfit.top.images?.[0]?.src} alt="Top" fill className="object-contain" />
                                    <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition"><RotateCcw className="h-3 w-3" /></div>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-sm">Select Top</span>
                            )}
                        </div>

                        {/* Bottom Slot */}
                        <div className="w-48 h-64 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-50 relative group">
                            {outfit.bottom ? (
                                <div className="relative w-full h-full p-2 cursor-pointer" onClick={() => handleSelect(null, 'bottom')}>
                                    <Image src={outfit.bottom.image || outfit.bottom.images?.[0]?.src} alt="Bottom" fill className="object-contain" />
                                </div>
                            ) : (
                                <span className="text-gray-400 text-sm">Select Bottom</span>
                            )}
                        </div>

                        {/* Shoes Slot */}
                        <div className="w-48 h-32 border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-50 relative group">
                            {outfit.shoes ? (
                                <div className="relative w-full h-full p-2 cursor-pointer" onClick={() => handleSelect(null, 'shoes')}>
                                    <Image src={outfit.shoes.image || outfit.shoes.images?.[0]?.src} alt="Shoes" fill className="object-contain" />
                                </div>
                            ) : (
                                <span className="text-gray-400 text-sm">Select Shoes</span>
                            )}
                        </div>
                    </Card>
                </div>

                {/* SELECTOR */}
                <div className="lg:col-span-7 order-1 lg:order-2">
                    <Tabs defaultValue="tops" className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto">
                            <TabsTrigger value="tops">Tops</TabsTrigger>
                            <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
                            <TabsTrigger value="shoes">Shoes</TabsTrigger>
                            <TabsTrigger value="wardrobe">My Wardrobe</TabsTrigger>
                        </TabsList>

                        <div className="mt-6 h-[600px] overflow-y-auto pr-2">
                            {['tops', 'bottoms', 'shoes'].map(type => (
                                <TabsContent key={type} value={type} className="mt-0">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                        {[...wardrobe, ...recommendations].filter(i => {
                                            const cat = (i.category || '').toLowerCase()
                                            if (type === 'tops') return ['shirt', 'top', 'jacket', 'hoodie', 'dress'].some(c => cat.includes(c))
                                            if (type === 'bottoms') return ['pant', 'jean', 'skirt', 'short', 'trouser'].some(c => cat.includes(c))
                                            if (type === 'shoes') return ['shoe', 'boot', 'sneaker', 'heel'].some(c => cat.includes(c))
                                            return false
                                        }).map(item => (
                                            <div key={item.id} className="cursor-pointer group" onClick={() => handleSelect(item, type as any)}>
                                                <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-gray-100 mb-2 border-2 border-transparent hover:border-indigo-500 transition-all">
                                                    <Image src={item.image || item.images?.[0]?.src || '/placeholder.jpg'} alt={item.name} fill className="object-cover" />
                                                </div>
                                                <p className="text-xs font-medium truncate">{item.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                            <TabsContent value="wardrobe" className="mt-0">
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {wardrobe.map(item => (
                                        <div key={item.id} className="cursor-pointer group" onClick={() => {
                                            // Auto-detect type
                                            const cat = (item.category || item.name || '').toLowerCase()
                                            let type: any = 'top'
                                            if (['pant', 'jean', 'skirt', 'short'].some(c => cat.includes(c))) type = 'bottom'
                                            if (['shoe', 'boot', 'sneaker'].some(c => cat.includes(c))) type = 'shoes'
                                            handleSelect(item, type)
                                        }}>
                                            <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-gray-100 mb-2 border-2 border-transparent hover:border-indigo-500 transition-all">
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                                <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 rounded backdrop-blur-sm">
                                                    Owned
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium truncate">{item.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
