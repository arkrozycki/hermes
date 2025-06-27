'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Settings as SettingsComponent } from '@/components/settings'
import { useRouter, usePathname } from 'next/navigation'
import { LanguageProvider } from '@/hooks/use-language'
import { cn } from '@/lib/utils'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Determine active tab based on current path
  const activeTab = pathname === '/flashcards' ? 'flashcards' : 'translate'
  
  const handleTabChange = (value: string) => {
    if (value === 'translate') {
      router.push('/translate')
    } else if (value === 'flashcards') {
      router.push('/flashcards')
    }
  }

  return (
    <LanguageProvider>
      <div className="flex h-screen flex-col bg-white">
        {/* Tab Header */}
        <div className="flex items-center justify-between p-4 border-0 bg-white">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <button
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                activeTab === 'translate'
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/60"
              )}
              onClick={() => handleTabChange('translate')}
            >
              Translate
            </button>
            <button
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                activeTab === 'flashcards'
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/60"
              )}
              onClick={() => handleTabChange('flashcards')}
            >
              Flashcards
            </button>
            <button className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                activeTab === 'roleplay'
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/60"
              )}
              onClick={() => handleTabChange('roleplay')}
            >Roleplay</button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <SettingsComponent />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden bg-white border-0">
          {children}
        </div>
      </div>
    </LanguageProvider>
  )
} 