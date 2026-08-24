import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Download, Share2, Sparkles, ArrowRight } from 'lucide-react'
import { AccountLayout } from '@/components/account/account-layout'

export const dynamic = 'force-dynamic'

export default async function TryOnHistoryPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: tryons, error } = await supabase
        .from('tryon_results')
        .select('*, products(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error(error)
    }

    return (
        <AccountLayout title="Virtual Try-On History" description="Your collection of AI-generated looks">
            {!tryons || tryons.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white/50 dark:bg-white/5">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-6">
                        <Sparkles className="h-8 w-8" />
                    </div>
                    <h2 className="text-lg font-bold mb-2">No try-ons yet</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
                        Experience the magic of AI styling. Pick a product and click &quot;Try On&quot; to see how it looks on you.
                    </p>
                    <Button asChild>
                        <Link href="/shop">
                            Start Styling <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {tryons.map((tryon) => (
                        <Card key={tryon.id} className="group overflow-hidden border-0 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
                            <div className="relative aspect-[3/4] bg-gray-100">
                                <Image
                                    src={tryon.result_image_url || tryon.products?.image || ''}
                                    alt="Try-on result"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between">
                                    <Button size="sm" variant="secondary" className="h-7 text-xs backdrop-blur-md bg-white/20 text-white border-none hover:bg-white/40">
                                        <Download className="h-3 w-3 mr-1" /> Save
                                    </Button>
                                    <Button size="sm" variant="secondary" className="h-7 text-xs backdrop-blur-md bg-white/20 text-white border-none hover:bg-white/40">
                                        <Share2 className="h-3 w-3 mr-1" /> Share
                                    </Button>
                                </div>

                                {/* Date Badge */}
                                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(tryon.created_at).toLocaleDateString()}
                                </div>
                            </div>
                            <CardContent className="p-3">
                                <h3 className="font-semibold truncate text-sm mb-2">{tryon.products?.name}</h3>
                                <Button variant="outline" size="sm" asChild className="w-full h-8 text-xs">
                                    <Link href={`/product/${tryon.product_id}`}>
                                        Shop Item
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </AccountLayout>
    )
}
