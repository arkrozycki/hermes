import * as React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

export interface TranslationHistory {
  id: number
  source_language: string
  target_language: string
  input_text: string
  output_text: string
  timestamp: string
  was_cached: boolean
}

interface HistoryProps {
  translations: TranslationHistory[]
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
}

export function History({ translations, onLoadMore, hasMore, isLoading }: HistoryProps) {
  return (
    <div className="flex flex-col gap-2">
      <ScrollArea className="p-4">
        <div className="flex flex-col gap-2">
          {translations.map((translation) => (
            <div
              key={translation.id}
              className="flex flex-col gap-1 rounded-lg border p-3 text-sm"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>
                    {translation.source_language} → {translation.target_language}
                  </span>
                  {translation.was_cached && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                      cached
                    </span>
                  )}
                </div>
                <span>{new Date(translation.timestamp).toLocaleString()}</span>
              </div>
              <div className="font-medium">{translation.input_text}</div>
              <div className="text-muted-foreground">{translation.output_text}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onLoadMore}
          disabled={isLoading}
        >
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              Load More <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  )
} 