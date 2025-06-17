import { globalShortcut, BrowserWindow } from 'electron'

export function setupShortcuts() {
  // Register CMD+K (or Ctrl+K) to toggle app visibility
  globalShortcut.register('CommandOrControl+K', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isVisible() && win.isFocused()) {
        // If window is visible and focused, hide it
        win.hide()
      } else {
        // If window is hidden or not focused, show and focus it
        if (win.isMinimized()) {
          win.restore()
        }
        win.show()
        win.focus()
      }
    }
  })
}

export function cleanupShortcuts() {
  // Unregister all shortcuts when the app is closing
  globalShortcut.unregisterAll()
} 