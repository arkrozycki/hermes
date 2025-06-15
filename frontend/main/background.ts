import path from 'path'
import { app, BrowserWindow, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { setupShortcuts, cleanupShortcuts } from './shortcuts'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (isProd) {
    await mainWindow.loadURL('app://./')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/`)
    mainWindow.webContents.openDevTools()
  }

  // Setup global shortcuts
  setupShortcuts()
})()

app.on('window-all-closed', () => {
  cleanupShortcuts()
  app.quit()
})
