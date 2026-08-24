import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Smartphone, ShieldCheck, RotateCcw, Youtube, MapPin, Mail, Phone } from 'lucide-react'
import Image from 'next/image'

export function SiteFooter() {
    return (
        <footer className="bg-white border-t border-gray-200 pt-6 md:pt-12 pb-4 md:pb-8 text-[#282c3f]">
            <div className="container mx-auto px-3 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1.5fr_1fr] gap-4 md:gap-8 mb-6 md:mb-12">
                    {/* Column 1: Online Shopping */}
                    <div className="flex flex-col gap-0.5 md:gap-1">
                        <h4 className="font-bold text-[10px] md:text-xs uppercase mb-3 md:mb-6 tracking-wider text-gray-900">Shopping</h4>
                        <FooterLink href="/shop/men">Men</FooterLink>
                        <FooterLink href="/shop/women">Women</FooterLink>
                        <FooterLink href="/shop/kids">Kids</FooterLink>
                        <FooterLink href="/shop/home-living">Home & Living</FooterLink>
                        <FooterLink href="/shop/beauty">Beauty</FooterLink>
                        <FooterLink href="/shop/gift-cards">Gift Cards</FooterLink>
                    </div>

                    {/* Column 2: Customer Policies */}
                    <div className="flex flex-col gap-0.5 md:gap-1">
                        <h4 className="font-bold text-[10px] md:text-xs uppercase mb-3 md:mb-6 tracking-wider text-gray-900">Help</h4>
                        <FooterLink href="/contact">Contact</FooterLink>
                        <FooterLink href="/faq">FAQ</FooterLink>
                        <FooterLink href="/terms">T&C</FooterLink>
                        <FooterLink href="/track-order">Track Orders</FooterLink>
                        <FooterLink href="/shipping">Shipping</FooterLink>
                        <FooterLink href="/returns">Returns</FooterLink>
                        <FooterLink href="/privacy">Privacy</FooterLink>
                    </div>

                    {/* Column 3: App & Social */}
                    <div className="flex flex-col col-span-2 md:col-span-1">
                        <h4 className="font-bold text-[10px] md:text-xs uppercase mb-3 md:mb-6 tracking-wider text-gray-900">FitMirror App</h4>
                        <div className="flex gap-2 md:gap-3 mb-4 md:mb-8">
                            <Link href="#" className="w-[100px] md:w-[140px] h-[32px] md:h-[42px] relative bg-black rounded-md md:rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 hover:opacity-90 transition-opacity">
                                <StoreBadge type="play" />
                            </Link>
                            <Link href="#" className="w-[100px] md:w-[140px] h-[32px] md:h-[42px] relative bg-black rounded-md md:rounded-lg overflow-hidden flex items-center justify-center border border-gray-300 hover:opacity-90 transition-opacity">
                                <StoreBadge type="app" />
                            </Link>
                        </div>

                        <h4 className="font-bold text-[10px] md:text-xs uppercase mb-2 md:mb-4 tracking-wider text-gray-900">Follow Us</h4>
                        <div className="flex gap-3 md:gap-4 text-gray-500">
                            <SocialIcon Icon={Facebook} href="#" />
                            <SocialIcon Icon={Twitter} href="#" />
                            <SocialIcon Icon={Youtube} href="#" />
                            <SocialIcon Icon={Instagram} href="#" />
                        </div>
                    </div>

                    {/* Column 4: Guarantees - Hidden on small mobile */}
                    <div className="hidden md:flex flex-col gap-4 md:gap-6 pl-0 md:pl-8">
                        <div className="flex gap-3 md:gap-4 items-start">
                            <div className="min-w-[40px] md:min-w-[48px] h-[32px] md:h-[40px] flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-gray-600" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-xs md:text-sm">100% ORIGINAL</p>
                                <p className="text-gray-500 text-xs md:text-sm">guarantee for all products</p>
                            </div>
                        </div>
                        <div className="flex gap-3 md:gap-4 items-start">
                            <div className="min-w-[40px] md:min-w-[48px] h-[32px] md:h-[40px] flex items-center justify-center">
                                <RotateCcw className="w-6 h-6 md:w-8 md:h-8 text-gray-600" strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-xs md:text-sm">14 Day Returns</p>
                                <p className="text-gray-500 text-xs md:text-sm">of receiving your order</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Popular Searches - Collapsed on mobile */}
                <div className="mb-4 md:mb-10 hidden md:block">
                    <h4 className="font-bold text-xs uppercase mb-4 tracking-wider text-gray-900">Popular Searches</h4>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500 leading-6">
                        {[
                            "Makeup", "Dresses For Girls", "T-Shirts", "Sandals", "Headphones", "Babydolls", "Blazers For Men",
                            "Handbags", "Ladies Watches", "Bags", "Sport Shoes", "Reebok Shoes", "Puma Shoes", "Boxers", "Wallets",
                            "Tops", "Earrings", "Fastrack Watches", "Kurtis", "Nike", "Smart Watches", "Titan Watches", "Designer Sarees"
                        ].map((term, i, arr) => (
                            <span key={term} className="group cursor-pointer">
                                <Link href={`/shop/${term.toLowerCase().replace(/ /g, '-')}`} className="hover:text-amber-600 transition-colors">
                                    {term}
                                </Link>
                                {i < arr.length - 1 && <span className="text-gray-300 ml-2">|</span>}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-gray-200 pt-4 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4 text-[10px] md:text-sm text-gray-500">
                    <div className="flex flex-col md:flex-row gap-1 md:gap-8 items-center">
                        <p>Concern? <Link href="/contact" className="text-blue-600 font-semibold hover:underline">Contact Us</Link></p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 text-center">
                        <p>© 2026 fitmirror.in. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href} className="text-gray-500 hover:text-gray-900 hover:font-medium transition-all text-sm py-1">
            {children}
        </Link>
    )
}

function SocialIcon({ Icon, href }: { Icon: any, href: string }) {
    return (
        <Link href={href} className="text-gray-500 hover:text-gray-900 transition-colors">
            <Icon className="w-5 h-5" />
        </Link>
    )
}

function StoreBadge({ type }: { type: 'play' | 'app' }) {
    if (type === 'play') {
        return (
            <div className="flex items-center gap-2 px-3">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" fill="currentColor"><path d="M3.609 1.814a.434.434 0 00-.175.367v19.638c0 .144.064.277.175.367l9.782-9.67-9.782-10.702zM14.966 11.237L4.996 1.48c.189-.126.417-.184.646-.146.401.066.758.307.973.654l8.351 16.736-1.587-7.487zm0 1.526l1.587-7.487-8.351 16.736c-.215.347-.572.588-.973.654-.229.038-.457-.02-.646-.146l9.97-9.757zM16.148 10.66l4.288-4.288c.187-.187.187-.49 0-.677-.187-.187-.49-.187-.677 0l-3.611 3.611 1.354 1.354zM16.148 13.34l-1.354 1.354 3.611 3.611c.187.187.49.187.677 0 .187-.187.187-.49 0-.677l-4.288-4.288z" /></svg>
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[9px] text-gray-300 uppercase">Get it on</span>
                    <span className="text-sm font-semibold text-white">Google Play</span>
                </div>
            </div>
        )
    }
    return (
        <div className="flex items-center gap-2 px-3">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.165 6.839 9.49.5.09.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" /></svg>
            <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] text-gray-300 uppercase">Download on the</span>
                <span className="text-sm font-semibold text-white">App Store</span>
            </div>
        </div>
    )
}
