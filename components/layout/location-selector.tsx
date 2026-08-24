"use client"

import { useState, useEffect } from "react"
import { MapPin, ChevronDown, Loader2, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Address {
    id: string
    city: string
    postal_code: string
    state: string
    line1: string
    is_default?: boolean
}

interface LocationSelectorProps {
    addresses: Address[]
    className?: string
}

export function LocationSelector({ addresses, className }: LocationSelectorProps) {
    const [location, setLocation] = useState<string>("Select Location")
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Set default location if available
        const defaultAddr = addresses.find(a => a.is_default) || addresses[0]
        if (defaultAddr) {
            setLocation(`${defaultAddr.city} ${defaultAddr.postal_code}`)
        }
    }, [addresses])

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser")
            return
        }

        setLoading(true)
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords
                    // Use OpenStreetMap Nominatim for free reverse geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    )
                    const data = await response.json()

                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.county
                        const postalCode = data.address.postcode
                        const formattedParams = [city, postalCode].filter(Boolean).join(" ")

                        setLocation(formattedParams || "Current Location")
                        toast.success(`Location updated: ${formattedParams}`)
                    } else {
                        toast.error("Could not convert coordinates to address")
                    }
                } catch (error) {
                    console.error("Geocoding error:", error)
                    toast.error("Failed to fetch address details")
                } finally {
                    setLoading(false)
                }
            },
            (error) => {
                console.error("Geolocation error:", error)
                setLoading(false)
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        toast.error("Location permission denied")
                        break
                    case error.POSITION_UNAVAILABLE:
                        toast.error("Location information unavailable")
                        break
                    case error.TIMEOUT:
                        toast.error("Location request timed out")
                        break
                    default:
                        toast.error("An unknown error occurred")
                }
            },
            { timeout: 10000 }
        )
    }

    if (!mounted) return null

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "hidden md:flex items-center gap-1 text-muted-foreground hover:text-foreground px-2 h-9",
                        className
                    )}
                >
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="max-w-[140px] truncate text-xs font-medium">
                        {location}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
                <DropdownMenuLabel>Choose Location</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={(e) => {
                        e.preventDefault()
                        handleDetectLocation()
                    }}
                    className="cursor-pointer text-primary focus:text-primary font-medium"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Navigation className="h-4 w-4 mr-2 fill-current" />
                    )}
                    Detect my location
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {addresses.length > 0 ? (
                    addresses.map((addr) => (
                        <DropdownMenuItem
                            key={addr.id}
                            onClick={() => setLocation(`${addr.city} ${addr.postal_code}`)}
                            className="cursor-pointer flex flex-col items-start gap-1 py-2"
                        >
                            <span className="font-medium">{addr.city} {addr.postal_code}</span>
                            <span className="text-[10px] text-muted-foreground truncate w-full">
                                {addr.line1}
                            </span>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                        No saved addresses found
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
