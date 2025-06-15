import { useEffect } from 'react'

export function useShortcut(key: string, callback: string, onTrigger: () => void) {
  useEffect(() => {
    console.log('Setting up shortcut:', { key, callback })
    
    // Register the keyboard shortcut with the main process
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('register-shortcut', {
        key,
        callback
      })

      // Listen for the callback event
      const unsubscribe = window.electron.ipcRenderer.on(callback, () => {
        console.log('Shortcut triggered:', callback)
        onTrigger()
      })

      return () => {
        console.log('Cleaning up shortcut:', key)
        // Cleanup: unregister the shortcut
        window.electron.ipcRenderer.send('unregister-shortcut', key)
        unsubscribe()
      }
    } else {
      console.warn('Electron IPC not available')
    }
  }, [key, callback, onTrigger])
} 