'use client'

import * as React from 'react'

interface LanguageContextType {
  sourceLanguage: string
  targetLanguage: string
  setSourceLanguage: (language: string) => void
  setTargetLanguage: (language: string) => void
  swapLanguages: () => void
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [sourceLanguage, setSourceLanguage] = React.useState('en')
  const [targetLanguage, setTargetLanguage] = React.useState('es')

  const swapLanguages = React.useCallback(() => {
    const temp = sourceLanguage
    setSourceLanguage(targetLanguage)
    setTargetLanguage(temp)
  }, [sourceLanguage, targetLanguage])

  const value = React.useMemo(() => ({
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    swapLanguages
  }), [sourceLanguage, targetLanguage, swapLanguages])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 