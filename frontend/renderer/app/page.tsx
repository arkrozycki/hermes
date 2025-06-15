'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth.service'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push('/translate')
    } else {
      router.push('/login')
    }
  }, [router])

  return null // This page will redirect immediately, so no need for content
}
