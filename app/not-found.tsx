import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-center p-4">
            <h1 className="text-9xl font-serif font-bold text-gray-100 mb-4 select-none">404</h1>
            <div className="absolute">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Page Not Found</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <Link href="/">
                    <Button size="lg" className="rounded-full px-8">
                        Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    )
}
