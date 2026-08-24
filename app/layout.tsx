import type { Metadata } from 'next'
import './globals.css'
import NextTopLoader from 'nextjs-toploader'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { QuickViewModal } from '@/components/product/quick-view-modal'
import { OnboardingTour } from '@/components/onboarding-tour'
import { AssistantProvider } from '@/components/assistant/assistant-context'
import { AssistantFab } from '@/components/assistant/assistant-fab'
import { AssistantChat } from '@/components/assistant/chat-interface'

import { UserPreferencesProvider } from '@/components/providers/user-preferences-provider'
import { ErrorSuppressor } from '@/components/error-suppressor'
import { GenieProvider } from '@/components/global-genie'
import { ErrorObserver } from '@/components/providers/error-observer'
import { AnalyticsProvider } from '@/components/providers/analytics-provider'
import { PostHogProvider } from '@/lib/analytics/posthog'
import { MobileShell } from '@/components/mobile/mobile-shell'

export const metadata: Metadata = {
  metadataBase: new URL('https://fitmirror.in'), // Fixes social image resolution
  title: {
    default: 'FitMirror | Virtual Try-On Fashion',
    template: '%s | FitMirror'
  },
  description: 'Experience the perfect fit. Virtual try-on technology for the modern woman. Shop tops, dresses, jeans and more with confidence.',
  keywords: ['virtual try-on', 'fashion', 'online shopping', 'women fashion', 'fit mirror', 'clothing'],
  authors: [{ name: 'FitMirror' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FitMirror | Virtual Try-On Fashion',
    description: 'Experience the perfect fit. Virtual try-on technology for the modern woman.',
    url: 'https://fitmirror.in',
    siteName: 'FitMirror',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitMirror | Virtual Try-On Fashion',
    description: 'Experience the perfect fit. Virtual try-on technology for the modern fashion.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <NextTopLoader
          color="#f59e0b"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #f59e0b,0 0 5px #f59e0b"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'FitMirror',
                url: 'https://fitmirror.in',
                logo: 'https://fitmirror.in/logo.png',
                sameAs: [
                  'https://twitter.com/fitmirror',
                  'https://instagram.com/fitmirror',
                  'https://facebook.com/fitmirror'
                ],
                contactPoint: {
                  '@type': 'ContactPoint',
                  telephone: '+91-9876543210',
                  contactType: 'customer service',
                  areaServed: 'IN',
                  availableLanguage: 'en'
                }
              })
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'FitMirror',
                url: 'https://fitmirror.in',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://fitmirror.in/shop?q={search_term_string}',
                  'query-input': 'required name=search_term_string'
                }
              })
            }}
          />
          <PostHogProvider>
            <ErrorSuppressor />
            <GenieProvider>
              <ErrorObserver />
              <UserPreferencesProvider>
                <AnalyticsProvider>
                  <AssistantProvider>
                    <OnboardingTour />
                    {children}
                    <QuickViewModal />
                    <AssistantFab />
                    <AssistantChat />
                    <MobileShell />
                    <Toaster position="top-center" richColors />
                  </AssistantProvider>
                </AnalyticsProvider>
              </UserPreferencesProvider>
            </GenieProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
