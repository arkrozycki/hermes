import React from 'react'
import { Inter as FontSans } from 'next/font/google'
import '../styles/globals.css'
import { cn } from '@/lib/utils'
import { Metadata } from 'next'
import ThemeProvider from '@/components/providers/theme-provider'
import { SettingsProvider } from '@/hooks/use-settings'
import { registerServiceWorker, setupInstallPrompt } from './service-worker-registration'
import { InstallBanner } from '@/components/install-banner'

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
      { url: '/icons/light/web/favicon.ico', sizes: 'any', media: '(prefers-color-scheme: dark)' },
      { url: '/icons/dark/web/favicon.ico', sizes: 'any', media: '(prefers-color-scheme: light)' },
      { url: '/icons/light/web/favicon-16x16.png', sizes: '16x16', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icons/dark/web/favicon-16x16.png', sizes: '16x16', type: 'image/png', media: '(prefers-color-scheme: dark)' },
      { url: '/icons/light/web/favicon-32x32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icons/dark/web/favicon-32x32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: dark)' },
      { url: '/icons/light/web/favicon-48x48.png', sizes: '48x48', type: 'image/png', media: '(prefers-color-scheme: light)' },
      { url: '/icons/dark/web/favicon-48x48.png', sizes: '48x48', type: 'image/png', media: '(prefers-color-scheme: dark)' }
    ],
    apple: [
      { url: '/icons/light/web/apple-touch-icon.png', media: '(prefers-color-scheme: light)' },
      { url: '/icons/dark/web/apple-touch-icon.png', media: '(prefers-color-scheme: dark)' }
    ]
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  if (typeof window !== 'undefined') {
    registerServiceWorker()
    setupInstallPrompt()
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Hermes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, minimum-scale=1, user-scalable=yes, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/light/web/favicon.ico" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/icons/dark/web/favicon.ico" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/icons/light/web/apple-touch-icon.png" media="(prefers-color-scheme: light)" />
        <link rel="apple-touch-icon" href="/icons/dark/web/apple-touch-icon.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/light/web/favicon-16x16.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/dark/web/favicon-16x16.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/light/web/favicon-32x32.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/dark/web/favicon-32x32.png" media="(prefers-color-scheme: dark)" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/light/web/favicon-48x48.png" media="(prefers-color-scheme: light)" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/dark/web/favicon-48x48.png" media="(prefers-color-scheme: dark)" />
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
            <InstallBanner />
          </ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
