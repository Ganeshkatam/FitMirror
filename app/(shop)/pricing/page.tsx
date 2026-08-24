import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-5xl">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900">
                    Unlock Your Style Potential
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Choose the plan that fits your fashion journey. Upgrade to Pro for unlimited virtual try-ons and personalized AI styling.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Free Plan */}
                <div className="rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">Free</h3>
                    <div className="mt-4 flex items-baseline text-gray-900">
                        <span className="text-4xl font-bold tracking-tight">$0</span>
                        <span className="ml-1 text-xl font-semibold">/month</span>
                    </div>
                    <p className="mt-6 text-gray-600">The basics for every fashion enthusiast.</p>
                    <ul role="list" className="mt-6 space-y-4">
                        {['5 Virtual Try-Ons per day', 'Basic Outfit Builder', 'Standard Shipping', 'Community Access'].map((feature) => (
                            <li key={feature} className="flex">
                                <Check className="h-6 w-6 flex-none text-violet-600" />
                                <span className="ml-3 text-gray-600">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <Button variant="outline" className="mt-8 w-full" asChild>
                        <Link href="/account">Current Plan</Link>
                    </Button>
                </div>

                {/* Pro Plan */}
                <div className="relative rounded-2xl border border-violet-200 bg-violet-50 p-8 shadow-lg">
                    <div className="absolute top-0 right-0 -mt-4 mr-4 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wide">
                        Most Popular
                    </div>
                    <h3 className="text-lg font-semibold text-violet-900">Pro</h3>
                    <div className="mt-4 flex items-baseline text-violet-900">
                        <span className="text-4xl font-bold tracking-tight">$19</span>
                        <span className="ml-1 text-xl font-semibold">/month</span>
                    </div>
                    <p className="mt-6 text-violet-800">Everything you need to redefine your style.</p>
                    <ul role="list" className="mt-6 space-y-4">
                        {[
                            'Unlimited Virtual Try-Ons',
                            'AI Personal Stylist (24/7)',
                            'Priority Shipping',
                            'Early Access to New Collections',
                            'Exclusive Member Discounts'
                        ].map((feature) => (
                            <li key={feature} className="flex">
                                <Check className="h-6 w-6 flex-none text-violet-600" />
                                <span className="ml-3 text-gray-700">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <Button className="mt-8 w-full bg-violet-600 hover:bg-violet-700" size="lg">
                        Upgrade Now
                    </Button>
                </div>
            </div>
        </div>
    )
}
