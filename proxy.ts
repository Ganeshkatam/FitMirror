import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const path = request.nextUrl.pathname

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If Supabase environment variables are missing, proceed safely
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
        if (path.startsWith('/account') || path.startsWith('/checkout') || path.startsWith('/profile')) {
            const redirectUrl = new URL('/login', request.url)
            redirectUrl.searchParams.set('next', path)
            return NextResponse.redirect(redirectUrl)
        }
        return response
    }

    try {
        // 1. Setup Supabase Client
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: CookieOptions) {
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        // 2. Align Auth Session
        const { data } = await supabase.auth.getUser()
        const user = data?.user

        // 3. Customer Protected Routes
        if (path.startsWith('/account') || path.startsWith('/checkout') || path.startsWith('/profile')) {
            if (!user) {
                const redirectUrl = new URL('/login', request.url)
                redirectUrl.searchParams.set('next', path)
                return NextResponse.redirect(redirectUrl)
            }
        }
    } catch (error) {
        console.error('Middleware auth check error:', error)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
