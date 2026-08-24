'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Truck, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ShippingMethod = 'standard' | 'express'

interface ShippingOptionsProps {
    value: ShippingMethod
    onChange: (value: ShippingMethod) => void
    expressCost: number
}

export function ShippingOptions({ value, onChange, expressCost }: ShippingOptionsProps) {
    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Delivery Method
                </CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup value={value} onValueChange={(v) => onChange(v as ShippingMethod)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        className={cn(
                            "relative flex items-center space-x-2 border rounded-xl p-4 cursor-pointer transition-all hover:bg-muted/50",
                            value === 'standard' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        )}
                        onClick={() => onChange('standard')}
                    >
                        <RadioGroupItem value="standard" id="standard" className="sr-only" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <Label htmlFor="standard" className="font-semibold cursor-pointer">Standard Delivery</Label>
                                <span className="text-sm font-medium text-green-600">Free</span>
                            </div>
                            <p className="text-sm text-muted-foreground group">
                                Estimated delivery: <span className="text-foreground font-medium">5-7 Business Days</span>
                            </p>
                        </div>
                        {value === 'standard' && (
                            <div className="absolute top-4 right-4 bg-primary rounded-full p-1">
                                <Truck className="h-3 w-3 text-primary-foreground" />
                            </div>
                        )}
                    </div>

                    <div
                        className={cn(
                            "relative flex items-center space-x-2 border rounded-xl p-4 cursor-pointer transition-all hover:bg-muted/50",
                            value === 'express' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        )}
                        onClick={() => onChange('express')}
                    >
                        <RadioGroupItem value="express" id="express" className="sr-only" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="express" className="font-semibold cursor-pointer">Express Delivery</Label>
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                        Fast
                                    </span>
                                </div>
                                <span className="text-sm font-medium">₹{expressCost}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Estimated delivery: <span className="text-foreground font-medium">2-3 Business Days</span>
                            </p>
                        </div>
                        {value === 'express' && (
                            <div className="absolute top-4 right-4 bg-amber-500 rounded-full p-1">
                                <Zap className="h-3 w-3 text-white" />
                            </div>
                        )}
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
    )
}
