import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { ArrowLeftRight, ArrowRightLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LanguageSelectorProps {
  sourceLanguage: string
  targetLanguage: string
  onSourceChange: (value: string) => void
  onTargetChange: (value: string) => void
  onSwap: () => void
  className?: string
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' }
]

export function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceChange,
  onTargetChange,
  onSwap,
  className
}: LanguageSelectorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={sourceLanguage}
        onValueChange={onSourceChange}
      >
        <SelectTrigger className="w-24 border-0 text-xs">
          {sourceLanguage}
        </SelectTrigger>
        <SelectContent className="border-0 shadow-md text-xs">
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="border-0 text-xs">
              <div className="flex items-center gap-2">
                <span>{lang.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSwap}
              className="h-7 w-7 text-muted-foreground opacity-60">
              <ArrowRightLeft className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Swap languages</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Select
        value={targetLanguage}
        onValueChange={onTargetChange}
      >
        <SelectTrigger className="w-24 border-0 text-xs">
          {targetLanguage}
        </SelectTrigger>
        <SelectContent className="border-0 shadow-md text-xs">
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="border-0 text-xs">
              <div className="flex items-center gap-2">
                <span>{lang.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
