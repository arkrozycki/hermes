'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
import { TranslationChat } from '@/components/translation-chat'
import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function TranslatePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  return (
    <AuthenticatedLayout>
      <div className="h-full w-full">
        <TranslationChat />
      </div>
    </AuthenticatedLayout>
  )
}
