"use client"

import React, { useEffect, useState } from 'react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from '@/components/ui/button'
import { X, ChevronRight, ChevronLeft, Info, Heart, User, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
    {
        target: 'body', // Fallback
        title: "Welcome to FitMirror! ✨",
        content: "Discover your perfect fit with our AI-powered virtual try-on technology. Let&apos;s take a quick tour.",
        position: 'center'
    },
    {
        target: 'nav-search', // We need to add IDs to these elements
        title: "Smart Search",
        content: "Find exactly what you&apos;re looking for with our instant search.",
        position: 'bottom'
    },
    {
        target: 'nav-wishlist',
        title: "Your Favorites",
        content: "Save items you love to your wishlist for later.",
        position: 'bottom'
    },
    {
        target: 'nav-account',
        title: "Body Profile",
        content: "Create your Body Profile in account settings for personalized AI try-ons.",
        position: 'bottom-end'
    }
]

export function OnboardingTour() {
    const [currentStep, setCurrentStep] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line
        setHasMounted(true)
        const completed: string | null = localStorage.getItem('fitmirror_onboarding_completed')
        if (!completed) {
            // Small delay to let UI load
            setTimeout(() => setIsOpen(true), 1500)
        }
    }, [])

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            handleComplete()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleComplete = () => {
        setIsOpen(false)
        localStorage.setItem('fitmirror_onboarding_completed', 'true')
    }

    if (!hasMounted || !isOpen) return null

    // For V1.2 MVP, we'll use a fixed centered modal for simplicity instead of complex positioning libraries
    // This avoids dependency issues and potential z-index conflicts
    const step = STEPS[currentStep]

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none p-4 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-500">
            <div className="bg-background border rounded-xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto relative animate-in slide-in-from-bottom-10 zoom-in-95 duration-300">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleComplete}
                >
                    <X className="h-4 w-4" />
                </Button>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            {currentStep === 0 && <Info className="h-6 w-6" />}
                            {currentStep === 1 && <Search className="h-6 w-6" />}
                            {currentStep === 2 && <Heart className="h-6 w-6" />}
                            {currentStep === 3 && <User className="h-6 w-6" />}
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-lg">{step.title}</h3>
                            <div className="flex gap-1 mt-1">
                                {STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1.5 w-6 rounded-full transition-colors",
                                            i === currentStep ? "bg-primary" : "bg-muted"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {step.content}
                    </p>

                    <div className="flex justify-between items-center mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={cn(currentStep === 0 && "opacity-0")}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <Button onClick={handleNext} size="sm" className="rounded-full px-6">
                            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
                            {currentStep !== STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
