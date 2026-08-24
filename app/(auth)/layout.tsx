import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            {/* Left: Decorative Panel (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-20 left-20 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl" />
                <div className="absolute bottom-32 right-20 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
                    <div className="animate-fade-in">
                        <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
                            <Sparkles className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">FitMirror</h1>
                        <p className="text-lg text-muted-foreground max-w-md">
                            Experience the future of fashion with our AI-powered virtual try-on technology.
                        </p>

                        <div className="mt-12 space-y-4">
                            <div className="flex items-center justify-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600">✓</span>
                                </div>
                                <span>See clothes on your body before buying</span>
                            </div>
                            <div className="flex items-center justify-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600">✓</span>
                                </div>
                                <span>85% fit accuracy guarantee</span>
                            </div>
                            <div className="flex items-center justify-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600">✓</span>
                                </div>
                                <span>Free shipping on all orders</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Auth Form */}
            <div className="flex-1 flex items-center justify-center p-3 md:p-8 bg-background">
                <div className="w-full max-w-md space-y-6 md:space-y-8 animate-fade-in">
                    {/* Logo for mobile */}
                    <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-4 md:mb-8">
                        <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg md:rounded-xl flex items-center justify-center">
                            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <span className="text-xl md:text-2xl font-serif font-bold">FitMirror</span>
                    </Link>

                    {children}

                    {/* Back to home */}
                    <div className="text-center">
                        <Link href="/" className="text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
