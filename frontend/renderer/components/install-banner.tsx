'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, X } from 'lucide-react'
import { isIOSPWA } from '@/app/service-worker-registration'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    setIsStandalone(isIOSPWA() || window.matchMedia('(display-mode: standalone)').matches)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    // Check if on iOS Safari (doesn't support beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = isIOSPWA()
    
    if (isIOS && !isInStandaloneMode) {
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response to the install prompt: ${outcome}`)
      setDeferredPrompt(null)
      setShowBanner(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    // Store dismissal in localStorage to avoid showing again for some time
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed or dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) { // Don't show for 7 days after dismissal
        setShowBanner(false)
      }
    }
  }, [])

  if (!showBanner || isStandalone) {
    return null
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-medium">Install Hermes</p>
              {isIOS ? (
                <p className="text-muted-foreground">
                  Tap <span className="font-semibold">Share</span> then{' '}
                  <span className="font-semibold">Add to Home Screen</span>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Get the full app experience
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isIOS && deferredPrompt && (
              <Button 
                onClick={handleInstallClick}
                size="sm"
                className="h-8"
              >
                Install
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 