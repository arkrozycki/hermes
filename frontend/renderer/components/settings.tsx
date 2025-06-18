'use client'

import * as React from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { useSettings } from '@/hooks/use-settings'

export function Settings() {
  const { settings, updateSettings } = useSettings()

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
    </Card>
  )
} 