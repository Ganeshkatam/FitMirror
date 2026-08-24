"use client"

import * as React from "react"
import { cn } from "./lib/utils"

const CollapsibleContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
} | undefined>(undefined)

const Collapsible = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        open?: boolean
        onOpenChange?: (open: boolean) => void
        defaultOpen?: boolean
    }
>(({ className, open: controlledOpen, onOpenChange, defaultOpen = false, ...props }, ref) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen

    const handleOpenChange = React.useCallback((newOpen: boolean) => {
        if (!isControlled) {
            setUncontrolledOpen(newOpen)
        }
        onOpenChange?.(newOpen)
    }, [isControlled, onOpenChange])

    return (
        <CollapsibleContext.Provider value={{ open: !!open, onOpenChange: handleOpenChange }}>
            <div ref={ref} className={cn("w-full", className)} {...props} />
        </CollapsibleContext.Provider>
    )
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext)

    if (!context) {
        throw new Error("CollapsibleTrigger must be used within Collapsible")
    }

    return (
        <button
            ref={ref}
            type="button" // Important for preventing form submission
            className={cn(className)}
            onClick={(e) => {
                context.onOpenChange(!context.open)
                onClick?.(e)
            }}
            {...props}
        >
            {children}
        </button>
    )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext)

    if (!context) {
        throw new Error("CollapsibleContent must be used within Collapsible")
    }

    if (!context.open) {
        return null
    }

    return (
        <div
            ref={ref}
            className={cn("overflow-hidden animate-in slide-in-from-top-1 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-1", className)}
            {...props}
        >
            {children}
        </div>
    )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
