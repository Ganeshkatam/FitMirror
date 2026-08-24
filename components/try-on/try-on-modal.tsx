'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Camera, Ruler, Weight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { generateUserTryOn } from '@/lib/actions/ai'

interface TryOnModalProps {
    productId?: string
    productImage: string
    triggerText?: React.ReactNode
}

export function TryOnModal({ productId: _productId, productImage, triggerText }: TryOnModalProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [step, setStep] = React.useState<'check-profile' | 'upload' | 'processing' | 'result'>('check-profile')
    const [loading, setLoading] = React.useState(false)
    const [uploadProgress, setUploadProgress] = React.useState(0)

    // Form Data
    const [height, setHeight] = React.useState('')
    const [weight, setWeight] = React.useState('')
    const [file, setFile] = React.useState<File | null>(null)

    // Result
    const [resultImage, setResultImage] = React.useState<string | null>(null)

    const supabase = createClient()

    // 1. Check if user has profile on open
    React.useEffect(() => {
        if (open && step === 'check-profile') {
            checkProfile()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    async function checkProfile() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setOpen(false)
            toast.error('Please login to use Virtual Try-On')
            router.push('/login')
            return
        }

        // Check DB
        const { data: profile } = await supabase
            .from('user_body_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (profile) {
            // Run Try On directly
            generateTryOn(profile.id)
        } else {
            // Show Upload Form
            setStep('upload')
        }
        setLoading(false)
    }

    async function handleUpload() {
        if (!file || !height || !weight) {
            toast.error('Please fill all fields and upload a photo')
            return
        }

        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            // 1. Upload Photo
            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}/full_body.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('body-photos')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // 2. Save Profile
            const { error: dbError } = await supabase
                .from('user_body_profiles')
                .upsert({
                    user_id: user.id,
                    height_cm: parseInt(height),
                    weight_kg: parseInt(weight),
                    photo_path: filePath
                })

            if (dbError) throw dbError

            toast.success('Profile created!')
            generateTryOn(user.id) // Using user_id as somewhat proxy for profile id usage logic below
        } catch (error) {
            toast.error('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
            setLoading(false)
        }
    }


    async function generateTryOn(profileId: string) {
        setStep('processing')

        // Simulate progress for UX
        let progress = 0
        const interval = setInterval(() => {
            progress += 10
            if (progress <= 90) setUploadProgress(progress)
        }, 300)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not found")

            // Call Server Action
            const result = await generateUserTryOn(user.id, productImage, { profileId })

            clearInterval(interval)
            setUploadProgress(100)

            if (result.success && result.imageUrl) {
                setResultImage(result.imageUrl)
                setStep('result')
            } else {
                toast.error(result.error || "Failed to generate try-on")
                setStep('check-profile') // Go back or stay?
            }
        } catch (error) {
            clearInterval(interval)
            toast.error("Error generating try-on")
            console.error(error)
            setStep('upload')
        } finally {
            setLoading(false)
        }
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerText || <Button>Virtual Try-On</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Virtual Try-On</DialogTitle>
                    <DialogDescription>
                        {step === 'upload' && "We need your body profile to generate the fit."}
                        {step === 'processing' && "AI is analyzing your fit..."}
                        {step === 'result' && "Here is how it looks on you!"}
                    </DialogDescription>
                </DialogHeader>

                {/* Step: Loading / Check */}
                {step === 'check-profile' && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Step: Upload */}
                {step === 'upload' && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="height">Height (cm)</Label>
                                <div className="relative">
                                    <Ruler className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="height"
                                        type="number"
                                        placeholder="165"
                                        className="pl-9"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <div className="relative">
                                    <Weight className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="weight"
                                        type="number"
                                        placeholder="60"
                                        className="pl-9"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Full Body Photo</Label>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                                        {file ? (
                                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                                        ) : (
                                            <>
                                                <Camera className="w-8 h-8 mb-2" />
                                                <p className="text-sm"><span className="font-semibold">Click to upload</span> full body shot</p>
                                            </>
                                        )}
                                    </div>
                                    <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                </label>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            Photo is stored privately and deleted at any time.
                        </p>

                        <Button onClick={handleUpload} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save & View Fit
                        </Button>
                    </div>
                )}

                {/* Step: Processing */}
                {step === 'processing' && (
                    <div className="space-y-6 py-6">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="relative h-48 w-32 bg-muted rounded-md overflow-hidden animate-pulse">
                                {/* Placeholder for animation */}
                            </div>
                            <Progress value={uploadProgress} className="w-[80%]" />
                            <p className="text-sm text-muted-foreground">Generating visualization...</p>
                        </div>
                    </div>
                )}

                {/* Step: Result */}
                {step === 'result' && resultImage && (
                    <div className="grid gap-4">
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted">
                            <Image src={resultImage} alt="Try On Result" fill className="object-cover" />
                            <Badge className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-600">
                                Simulated V1 Result
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>Retake Photo</Button>
                            <Button className="flex-1" onClick={() => setOpen(false)}>Add to Cart</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
