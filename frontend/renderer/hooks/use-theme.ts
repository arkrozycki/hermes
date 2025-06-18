import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export function useThemeWithMeta() {
  const { theme, systemTheme, setTheme } = useTheme()

  useEffect(() => {
    // Update theme-color meta tag based on current theme
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const currentTheme = theme === 'system' ? systemTheme : theme
      metaThemeColor.setAttribute('content', currentTheme === 'dark' ? '#000000' : '#ffffff')
    }
  }, [theme, systemTheme])

  return { theme, systemTheme, setTheme }
} 