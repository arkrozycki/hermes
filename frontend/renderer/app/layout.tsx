import { Inter as FontSans } from 'next/font/google'
import '../styles/globals.css'
import { cn } from '@/lib/utils'
import { Metadata } from 'next'
import ThemeProvider from '@/components/providers/theme-provider'
import { SettingsProvider } from '@/hooks/use-settings'
import { registerServiceWorker } from './service-worker-registration'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})

export const metadata: Metadata = {
  title: 'Hermes',
  description: 'Hermes Application',
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hermes'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/web/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/web/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/web/favicon-48x48.png', sizes: '48x48', type: 'image/png' }
    ],
    apple: '/icons/web/apple-touch-icon.png'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  if (typeof window !== 'undefined') {
    registerServiceWorker()
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/web/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/web/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/web/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/web/favicon-48x48.png" />
      </head>
      <body
        className={cn('min-h-screen font-sans antialiased m-0 p-0', fontSans.variable)}>
        <SettingsProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
