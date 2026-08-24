'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { User, Camera, Ruler, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
export type BodyShape = 'hourglass' | 'pear' | 'rectangle' | 'inverted-triangle' | 'apple'

export function AvatarWizard() {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Form State
    const [gender, setGender] = useState('female')
    const [height, setHeight] = useState(165)
    const [weight, setWeight] = useState(60)
    const [shape, setShape] = useState<BodyShape>('hourglass')
    const [skinTone, setSkinTone] = useState('#f5d0b0')

    const nextStep = () => setStep(s => s + 1)
    const prevStep = () => setStep(s => s - 1)

    const handleSave = async () => {
        setLoading(true)
        // Simulate API call
        await new Promise(r => setTimeout(r, 2000))
        setLoading(false)
        toast.success("Avatar Profile Created", {
            description: "You can now try on clothes instantly!"
        })
        // Redirect or close logic here
    }

    return (
        <div className="max-w-xl mx-auto">
            {/* Progress */}
            <div className="flex justify-between mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                            step >= i ? "bg-black text-white" : "bg-gray-100 text-gray-400"
                        )}>
                            {step > i ? <Check className="h-4 w-4" /> : i}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                            {i === 1 ? 'Basics' : i === 2 ? 'Body Shape' : 'Photo'}
                        </span>
                    </div>
                ))}
            </div>

            <Card className="border-gray-200 shadow-xl">
                <CardContent className="p-6 md:p-8 min-h-[400px] flex flex-col">

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-2xl font-serif font-bold text-center">Let&apos;s verify your fit</h2>

                            <div className="space-y-4">
                                <div>
                                    <Label className="mb-2 block">I identify as</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            className={cn("p-4 border rounded-xl text-center transition-all", gender === 'female' ? "border-black bg-gray-50 ring-1 ring-black" : "hover:bg-gray-50")}
                                            onClick={() => setGender('female')}
                                        >
                                            <span className="text-2xl block mb-1">👩</span>
                                            <span className="font-medium">Female</span>
                                        </button>
                                        <button
                                            className={cn("p-4 border rounded-xl text-center transition-all", gender === 'male' ? "border-black bg-gray-50 ring-1 ring-black" : "hover:bg-gray-50")}
                                            onClick={() => setGender('male')}
                                        >
                                            <span className="text-2xl block mb-1">👨</span>
                                            <span className="font-medium">Male</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Height</Label>
                                            <span className="font-bold">{height} cm</span>
                                        </div>
                                        <Slider
                                            defaultValue={[165]}
                                            max={220}
                                            min={140}
                                            step={1}
                                            value={[height]}
                                            onValueChange={(v) => setHeight(v[0])}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <Label>Weight</Label>
                                            <span className="font-bold">{weight} kg</span>
                                        </div>
                                        <Slider
                                            defaultValue={[60]}
                                            max={150}
                                            min={40}
                                            step={1}
                                            value={[weight]}
                                            onValueChange={(v) => setWeight(v[0])}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full mt-auto rounded-full" onClick={nextStep}>Next Step</Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-2xl font-serif font-bold text-center">Your Body Shape</h2>
                            <p className="text-center text-muted-foreground text-sm">Select the shape that best describes you for better AI draping.</p>

                            <div className="grid grid-cols-3 gap-3">
                                {['hourglass', 'pear', 'rectangle', 'inverted-triangle', 'apple'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setShape(s as BodyShape)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 border rounded-xl hover:bg-gray-50 transition-all",
                                            shape === s ? "border-black ring-1 ring-black bg-gray-50" : "border-gray-200"
                                        )}
                                    >
                                        {/* Placeholder Icons - In real app use SVGs */}
                                        <div className="h-10 w-8 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-xs text-gray-500">
                                            {s[0].toUpperCase()}
                                        </div>
                                        <span className="text-[10px] uppercase font-bold tracking-wide">{s.replace('-', ' ')}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <Label>Skin Tone</Label>
                                <div className="flex justify-between gap-2">
                                    {['#f5d0b0', '#eac096', '#d8a07f', '#bb8163', '#8d553a', '#5f3a25'].map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setSkinTone(color)}
                                            className={cn(
                                                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                                                skinTone === color ? "border-black scale-110" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto">
                                <Button variant="outline" className="flex-1 rounded-full" onClick={prevStep}>Back</Button>
                                <Button className="flex-1 rounded-full" onClick={nextStep}>Next Step</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center">
                            <h2 className="text-2xl font-serif font-bold">Privacy & Photo</h2>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                                To create your realistic avatar, we need a front-facing photo. Your photo is processed locally and encrypted.
                            </p>

                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:bg-gray-50 transition-colors cursor-pointer group">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Camera className="h-8 w-8" />
                                </div>
                                <h3 className="font-bold text-sm">Upload Full Body Photo</h3>
                                <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 10MB</p>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <Button variant="outline" className="flex-1 rounded-full" onClick={prevStep}>Back</Button>
                                <Button className="flex-1 rounded-full" onClick={handleSave} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Generate Avatar"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}
