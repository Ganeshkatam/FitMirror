'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Ruler } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface SizeGuideModalProps {
    category?: string
    gender?: string
}

export function SizeGuideModal({ category = 'clothing', gender = 'women' }: SizeGuideModalProps) {
    // Simplified Size Charts (can be moved to a config file)
    const sizeChart = {
        tops: [
            { size: 'XS', bust: '32', waist: '24', hip: '34' },
            { size: 'S', bust: '34', waist: '26', hip: '36' },
            { size: 'M', bust: '36', waist: '28', hip: '38' },
            { size: 'L', bust: '38', waist: '30', hip: '40' },
            { size: 'XL', bust: '41', waist: '33', hip: '43' },
        ],
        bottoms: [
            { size: 'XS', waist: '24-25', hip: '34-35' },
            { size: 'S', waist: '26-27', hip: '36-37' },
            { size: 'M', waist: '28-29', hip: '38-39' },
            { size: 'L', waist: '30-32', hip: '40-42' },
        ]
    }

    const isBottom = ['jeans', 'skirts', 'pants', 'trousers', 'shorts'].includes((category || '').toLowerCase())
    const data = isBottom ? sizeChart.bottoms : sizeChart.tops
    const headers = isBottom ? ['Size', 'Waist (in)', 'Hip (in)'] : ['Size', 'Bust (in)', 'Waist (in)', 'Hip (in)']

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground hover:text-black underline-offset-4 gap-1">
                    <Ruler className="h-3 w-3" /> Size Guide
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Size Guide</DialogTitle>
                    <DialogDescription>
                        Find your perfect fit. Measurements are in inches.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="chart" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="chart">Size Chart</TabsTrigger>
                        <TabsTrigger value="measure">How to Measure</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chart">
                        <ScrollArea className="h-[300px] border rounded-md">
                            <div className="w-full">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0">
                                        <tr>
                                            {headers.map(h => (
                                                <th key={h} className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.map((row: any, i) => (
                                            <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{row.size}</td>
                                                {isBottom ? (
                                                    <>
                                                        <td className="px-6 py-4">{row.waist}</td>
                                                        <td className="px-6 py-4">{row.hip}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-6 py-4">{row.bust}</td>
                                                        <td className="px-6 py-4">{row.waist}</td>
                                                        <td className="px-6 py-4">{row.hip}</td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="measure" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6 items-center bg-gray-50 p-6 rounded-lg">
                            <div className="space-y-4 text-sm text-gray-600">
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Bust</h4>
                                    <p>Measure under your arms at the fullest part of your bust. Keep the tape level.</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Waist</h4>
                                    <p>Measure around your natural waistline, keeping the tape comfortably loose.</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Hips</h4>
                                    <p>Stand with your feet together and measure around the fullest part of your hips.</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded border h-48 flex items-center justify-center text-muted-foreground text-xs text-center italic">
                                [Illustration Placeholder: Woman measuring tape]
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
