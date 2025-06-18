import { Inter as FontSans } from 'next/font/google'
import '../styles/globals.css'
import { cn } from '@/lib/utils'
import { Metadata } from 'next'
import ThemeProvider from '@/components/providers/theme-provider'
import { SettingsProvider } from '@/hooks/use-settings'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans'
})

export const metadata: Metadata = {
  title: 'Hermes',
  description: 'Translation App'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning>
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
