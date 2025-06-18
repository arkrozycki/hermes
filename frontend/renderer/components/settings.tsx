'use client'

import * as React from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/use-settings'
import { authService } from '@/lib/services/auth.service'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function Settings() {
  const { settings, updateSettings } = useSettings()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authService.logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <Card className="p-4 space-y-4 border-0">
      <div className="flex items-center justify-between">
        <Label htmlFor="save-words" className="text-sm font-medium">
          Save words
        </Label>
        <Switch
          id="save-words"
          checked={settings.saveWords}
          onCheckedChange={(checked) => updateSettings({ saveWords: checked })}
        />
      </div>

      <div className="">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="" />
          Logout
        </Button>
      </div>
    </Card>
  )
} 