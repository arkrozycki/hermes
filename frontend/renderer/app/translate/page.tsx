'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'
import { Translation } from '@/components/translation'

export default function TranslatePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="container mx-auto p-4">
      <Translation />
    </div>
  )
}
