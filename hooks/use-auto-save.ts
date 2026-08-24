
import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Hook to auto-save form data after a debounce interval.
 * 
 * @param data The data object to watch for changes.
 * @param saveAction Scoped server action function (e.g. `(data) => updateSettings(id, data)`).
 * @param delayMs Debounce delay in milliseconds (default 2000).
 */
export function useAutoSave<T>(
    data: T,
    saveAction: (data: T) => Promise<{ error?: string }>,
    delayMs: number = 2000
) {
    const [status, setStatus] = useState<AutoSaveStatus>('idle')
    const [lastSavedData, setLastSavedData] = useState<string>(JSON.stringify(data))
    const firstRender = useRef(true)

    const save = useCallback(async (currentData: T) => {
        setStatus('saving')
        try {
            const res = await saveAction(currentData)
            if (res?.error) throw new Error(res.error)

            setStatus('saved')
            setLastSavedData(JSON.stringify(currentData))
            // Reset to idle after a moment so "Saved" doesn't stick forever if undesired
            setTimeout(() => setStatus('idle'), 3000)
        } catch (err) {
            console.error("Auto-save failed:", err)
            setStatus('error')
            toast.error("Failed to save changes")
        }
    }, [saveAction])

    useEffect(() => {
        // Skip safe on first render/mount
        if (firstRender.current) {
            firstRender.current = false
            return
        }

        const currentString = JSON.stringify(data)
        if (currentString === lastSavedData) return

        const timer = setTimeout(() => {
            save(data)
        }, delayMs)

        return () => clearTimeout(timer)
    }, [data, delayMs, lastSavedData, save])

    return { status }
}
