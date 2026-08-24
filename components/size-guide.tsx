'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Ruler, Info } from 'lucide-react'

interface SizeGuideProps {
    category?: string
    trigger?: React.ReactNode
}

const TOPS_SIZES = [
    { size: 'XS', bust: '32', waist: '24', hips: '34', shoulder: '13.5' },
    { size: 'S', bust: '34', waist: '26', hips: '36', shoulder: '14' },
    { size: 'M', bust: '36', waist: '28', hips: '38', shoulder: '14.5' },
    { size: 'L', bust: '38', waist: '30', hips: '40', shoulder: '15' },
    { size: 'XL', bust: '40', waist: '32', hips: '42', shoulder: '15.5' },
    { size: 'XXL', bust: '42', waist: '34', hips: '44', shoulder: '16' },
    { size: 'XXXL', bust: '44', waist: '36', hips: '46', shoulder: '16.5' },
]

const BOTTOMS_SIZES = [
    { size: '28', waist: '28', hips: '36', inseam: '30', length: '40' },
    { size: '30', waist: '30', hips: '38', inseam: '30', length: '40' },
    { size: '32', waist: '32', hips: '40', inseam: '31', length: '41' },
    { size: '34', waist: '34', hips: '42', inseam: '31', length: '41' },
    { size: '36', waist: '36', hips: '44', inseam: '32', length: '42' },
    { size: '38', waist: '38', hips: '46', inseam: '32', length: '42' },
    { size: '40', waist: '40', hips: '48', inseam: '32', length: '42' },
]

const DRESS_SIZES = [
    { size: 'XS', bust: '32', waist: '24', hips: '34', length: '35' },
    { size: 'S', bust: '34', waist: '26', hips: '36', length: '36' },
    { size: 'M', bust: '36', waist: '28', hips: '38', length: '37' },
    { size: 'L', bust: '38', waist: '30', hips: '40', length: '38' },
    { size: 'XL', bust: '40', waist: '32', hips: '42', length: '39' },
    { size: 'XXL', bust: '42', waist: '34', hips: '44', length: '40' },
]

export function SizeGuide({ category, trigger }: SizeGuideProps) {
    const defaultTab = category === 'jeans' ? 'bottoms' : category === 'dress' ? 'dresses' : 'tops'

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="text-sm text-amber-600 hover:underline flex items-center gap-1">
                        <Ruler className="h-4 w-4" /> Size Guide
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Ruler className="h-5 w-5" /> Size Guide
                    </DialogTitle>
                    <DialogDescription>
                        All measurements are in inches. For the best fit, measure yourself and compare with the chart below.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue={defaultTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="tops">Tops</TabsTrigger>
                        <TabsTrigger value="dresses">Dresses</TabsTrigger>
                        <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tops" className="mt-4">
                        <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="p-3 text-left font-medium">Size</th>
                                        <th className="p-3 text-center font-medium">Bust</th>
                                        <th className="p-3 text-center font-medium">Waist</th>
                                        <th className="p-3 text-center font-medium">Hips</th>
                                        <th className="p-3 text-center font-medium">Shoulder</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {TOPS_SIZES.map((row, i) => (
                                        <tr key={row.size} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                            <td className="p-3 font-semibold">{row.size}</td>
                                            <td className="p-3 text-center">{row.bust}&quot;</td>
                                            <td className="p-3 text-center">{row.waist}&quot;</td>
                                            <td className="p-3 text-center">{row.hips}&quot;</td>
                                            <td className="p-3 text-center">{row.shoulder}&quot;</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    <TabsContent value="dresses" className="mt-4">
                        <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="p-3 text-left font-medium">Size</th>
                                        <th className="p-3 text-center font-medium">Bust</th>
                                        <th className="p-3 text-center font-medium">Waist</th>
                                        <th className="p-3 text-center font-medium">Hips</th>
                                        <th className="p-3 text-center font-medium">Length</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {DRESS_SIZES.map((row, i) => (
                                        <tr key={row.size} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                            <td className="p-3 font-semibold">{row.size}</td>
                                            <td className="p-3 text-center">{row.bust}&quot;</td>
                                            <td className="p-3 text-center">{row.waist}&quot;</td>
                                            <td className="p-3 text-center">{row.hips}&quot;</td>
                                            <td className="p-3 text-center">{row.length}&quot;</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    <TabsContent value="bottoms" className="mt-4">
                        <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="p-3 text-left font-medium">Size</th>
                                        <th className="p-3 text-center font-medium">Waist</th>
                                        <th className="p-3 text-center font-medium">Hips</th>
                                        <th className="p-3 text-center font-medium">Inseam</th>
                                        <th className="p-3 text-center font-medium">Length</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {BOTTOMS_SIZES.map((row, i) => (
                                        <tr key={row.size} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                            <td className="p-3 font-semibold">{row.size}</td>
                                            <td className="p-3 text-center">{row.waist}&quot;</td>
                                            <td className="p-3 text-center">{row.hips}&quot;</td>
                                            <td className="p-3 text-center">{row.inseam}&quot;</td>
                                            <td className="p-3 text-center">{row.length}&quot;</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* How to Measure */}
                <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <Info className="h-4 w-4 text-amber-600" />
                        How to Measure
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><strong>Bust:</strong> Measure around the fullest part of your bust</li>
                        <li><strong>Waist:</strong> Measure around your natural waistline (narrowest part)</li>
                        <li><strong>Hips:</strong> Measure around the fullest part of your hips</li>
                        <li><strong>Shoulder:</strong> Measure from shoulder seam to shoulder seam across your back</li>
                        <li><strong>Inseam:</strong> Measure from crotch to ankle</li>
                    </ul>
                </div>

                {/* Tips */}
                <div className="mt-4 text-sm text-muted-foreground">
                    <p>💡 <strong>Tip:</strong> If you&apos;re between sizes, we recommend sizing up for a more comfortable fit.</p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
