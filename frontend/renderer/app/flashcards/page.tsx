'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
import { FlashcardsTab } from '@/components/flashcards-tab'
import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function FlashcardsPage() {
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
        <FlashcardsTab />
      </div>
    </AuthenticatedLayout>
  )
} 