'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhotoUpload } from './photo-upload'
import { ResultViewer } from './result-viewer'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sparkles, ArrowLeft, Shirt, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useTryOnStore } from '@/lib/store/use-try-on'
import { logTryOnEvent } from '@/lib/actions/tryon-analytics'

interface Product {
    id: string
    name: string
    price: number
    image_url: string | null
    image?: string | null
    category: string
}

interface TryOnExperienceProps {
    product: Product
}

type Step = 'intro' | 'upload' | 'processing' | 'result'

export function TryOnExperience({ product }: TryOnExperienceProps) {

    const [step, setStep] = useState<Step>('intro')
    const [userPhoto, setUserPhoto] = useState<File | null>(null)
    const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
    const [resultUrl, setResultUrl] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const { initSession, sessionId } = useTryOnStore()

    // Initialize session and check for saved photo on mount
    useEffect(() => {
        initSession()

        const checkSavedProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data: profile } = await supabase
                    .from('user_body_profiles')
                    .select('photo_path')
                    .eq('user_id', user.id)
                    .single()

                if (profile?.photo_path) {
                    const { data } = supabase.storage
                        .from('body-photos')
                        .getPublicUrl(profile.photo_path)

                    if (data?.publicUrl) {
                        setUserPhotoUrl(data.publicUrl)
                        // If we have a photo, we can skip to upload step but show the preview
                        setStep('upload')
                    }
                }
            }
        }
        checkSavedProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handlePhotoSelect = (file: File | null, url: string | null) => {
        setUserPhoto(file)
        setUserPhotoUrl(url)
        setError(null)

        if (sessionId && file) {
            logTryOnEvent({
                sessionId,
                actionType: 'photo_uploaded'
            })
        }
    }

    const startTryOn = async () => {
        if (!userPhotoUrl) {
            setError('Please upload a photo first')
            return
        }

        setStep('processing')
        setProgress(0)
        setError(null)

        try {
            // 1. Upload to Supabase Storage if needed
            let personImageUrl = userPhotoUrl

            if (userPhoto) {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                // Allow guests to upload to a temp folder if not logged in
                const userId = user?.id || 'guest-' + crypto.randomUUID()
                const fileExt = userPhoto.name.split('.').pop()
                const filePath = `${userId}/${Date.now()}.${fileExt}`

                console.log("Uploading to storage:", filePath)

                try {
                    const { error: uploadError } = await supabase.storage
                        .from('body-photos')
                        .upload(filePath, userPhoto, { upsert: true })

                    if (uploadError) throw uploadError

                    const { data } = supabase.storage
                        .from('body-photos')
                        .getPublicUrl(filePath)

                    personImageUrl = data.publicUrl
                    console.log("Image uploaded:", personImageUrl)
                } catch (e) {
                    console.warn("Storage upload failed (RLS blocking), falling back to Data URI")
                    // Fallback: Convert to Base64 Data URI
                    personImageUrl = await new Promise((resolve) => {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve(reader.result as string)
                        reader.readAsDataURL(userPhoto)
                    })
                }
            }

            // 2. Call Try-On API
            const progressInterval = setInterval(() => {
                setProgress(p => Math.min(90, p + 5))
            }, 500)

            if (sessionId) {
                logTryOnEvent({
                    sessionId,
                    actionType: 'generation_requested',
                    payload: { productId: product.id }
                })
            }

            const response = await fetch('/api/try-on', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personImageUrl: personImageUrl, // Always public URL now
                    garmentImageUrl: product.image,

                    category: (() => {
                        const c = product.category.toLowerCase()
                        if (c.includes('bottom') || c.includes('pant') || c.includes('jean') || c.includes('skirt') || c.includes('short')) return 'bottoms'
                        if (c.includes('dress') || c.includes('jumpsuit') || c.includes('one-piece') || c.includes('gown')) return 'one-pieces'
                        return 'tops' // Default to tops (shirts, jackets, etc)
                    })()
                })
            })

            const data = await response.json()

            clearInterval(progressInterval)
            setProgress(100)

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Try-on failed')
            }

            setResultUrl(data.resultImage)

            if (sessionId) {
                logTryOnEvent({
                    sessionId,
                    actionType: 'generation_completed',
                    payload: { productId: product.id }
                })
            }
            setTimeout(() => setStep('result'), 500)

        } catch (err) {
            if (sessionId) {
                logTryOnEvent({
                    sessionId,
                    actionType: 'generation_failed',
                    payload: { error: err instanceof Error ? err.message : 'Unknown error' }
                })
            }
            setError(err instanceof Error ? err.message : 'Something went wrong')
            setStep('upload')
            toast.error('Try-on failed. Please try again.')
        }
    }

    const handleAddToCart = () => {
        // Add to local cart logic
        try {
            const cartData = localStorage.getItem('cart')
            const cart = cartData ? JSON.parse(cartData) : { items: [] }
            const existingItem = cart.items.find((item: { id: string }) => item.id === product.id)

            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1
            } else {
                cart.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image,
                    quantity: 1,
                })
            }

            localStorage.setItem('cart', JSON.stringify(cart))
            toast.success('Added to cart!')

            if (sessionId) {
                logTryOnEvent({
                    sessionId,
                    actionType: 'add_to_cart',
                    payload: { productId: product.id }
                })
            }
        } catch {
            // Ignore
        }
    }

    return (
        <div className="max-w-4xl mx-auto min-h-[600px] flex flex-col">
            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-8">
                {step !== 'intro' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep(step === 'result' ? 'upload' : 'intro')}
                        disabled={step === 'processing'}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                )}

                <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${step === 'intro' ? 'bg-amber-500' : 'bg-muted'}`} />
                    <span className={`h-2 w-2 rounded-full ${step === 'upload' ? 'bg-amber-500' : 'bg-muted'}`} />
                    <span className={`h-2 w-2 rounded-full ${step === 'processing' ? 'bg-amber-500' : 'bg-muted'}`} />
                    <span className={`h-2 w-2 rounded-full ${step === 'result' ? 'bg-amber-500' : 'bg-muted'}`} />
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-12 items-start">

                {/* Left Side: Product Details */}
                <div className="hidden lg:flex flex-col gap-6 w-1/3 sticky top-8">
                    <div className="bg-muted/30 p-6 rounded-2xl border">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Shirt className="h-5 w-5 text-amber-600" />
                            To be tried on
                        </h3>
                        <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-white mb-4">
                            {(product.image) ? (
                                <Image
                                    src={product.image || ''}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <Shirt className="h-10 w-10" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                            <p className="mt-2 font-bold text-amber-600">₹{product.price.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 items-start text-sm text-blue-700 dark:text-blue-300">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p>
                            Tips: For best results, use a photo with good lighting where you&apos;re standing straight. Avoid baggy clothes if possible!
                        </p>
                    </div>
                </div>

                {/* Right Side: Experience */}
                <div className="flex-1 w-full relative">
                    <AnimatePresence mode="wait">

                        {/* Step 1: Intro */}
                        {step === 'intro' && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center text-center py-12"
                            >
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30 flex items-center justify-center mb-6">
                                    <Sparkles className="h-10 w-10 text-amber-600" />
                                </div>
                                <h1 className="text-3xl font-bold mb-4">Virtual Try-On</h1>
                                <p className="text-lg text-muted-foreground mb-8 max-w-md">
                                    See how this item looks on you instantly with our AI technology.
                                </p>
                                <Button
                                    size="lg"
                                    onClick={() => setStep('upload')}
                                    className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-lg hover:shadow-xl transition-all"
                                >
                                    Start Magic <Sparkles className="ml-2 h-5 w-5" />
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 2: Upload */}
                        {step === 'upload' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-md mx-auto"
                            >
                                <h2 className="text-2xl font-bold mb-6 text-center">First, we need your photo</h2>

                                <PhotoUpload
                                    onPhotoSelect={handlePhotoSelect}
                                    existingPhotoUrl={userPhotoUrl}
                                    className="mb-8"
                                />

                                {error && (
                                    <div className="text-red-500 text-sm text-center mb-4 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    size="lg"
                                    className="w-full py-6 text-lg bg-gradient-to-r from-amber-500 to-rose-500 disabled:opacity-50"
                                    disabled={!userPhotoUrl}
                                    onClick={startTryOn}
                                >
                                    Generate Try-On <Sparkles className="ml-2 h-5 w-5" />
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 3: Processing */}
                        {step === 'processing' && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="relative w-32 h-32 mb-8">
                                    <div className="absolute inset-0 rounded-full border-4 border-muted" />
                                    <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                                    {userPhotoUrl && (
                                        <div className="absolute inset-2 rounded-full overflow-hidden">
                                            <Image
                                                src={userPhotoUrl}
                                                alt="User"
                                                fill
                                                className="object-cover opacity-50"
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-semibold mb-2">Creating your look...</h3>
                                <p className="text-muted-foreground mb-8">This usually takes about 10-15 seconds</p>

                                <div className="w-64">
                                    <Progress value={progress} className="h-2" />
                                </div>

                                <div className="mt-8 grid grid-cols-3 gap-2 text-xs text-muted-foreground opacity-70">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="p-2 bg-muted rounded-full">🔍</span>
                                        Analyzing fit
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="p-2 bg-muted rounded-full">👗</span>
                                        Aligning garment
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="p-2 bg-muted rounded-full">✨</span>
                                        Rendering magic
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Result */}
                        {step === 'result' && resultUrl && userPhotoUrl && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-lg mx-auto"
                            >
                                <h2 className="text-2xl font-bold mb-6 text-center">It looks great on you! 😍</h2>

                                <ResultViewer
                                    originalImage={userPhotoUrl}
                                    resultImage={resultUrl}
                                    productName={product.name}
                                    onRetry={() => setStep('upload')}
                                    onAddToCart={handleAddToCart}
                                    className="mb-8"
                                />

                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl text-center">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        Love this look? Add it to your cart or share it with friends!
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
