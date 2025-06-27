import path from 'path'
import fs from 'fs'
import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { setupShortcuts, cleanupShortcuts } from './shortcuts'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

// Function to get the appropriate icon path based on platform and theme
const getIconPath = () => {
  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  const platform = process.platform
  
  // In development, __dirname points to /path/to/frontend/app/
  // In production, __dirname points to the bundled app location
  const iconBasePath = isProd 
    ? path.join(__dirname, '..', 'renderer', 'public', 'icons') 
    : path.join(__dirname, '..', 'renderer', 'public', 'icons')
  
  let iconPath: string
  switch (platform) {
    case 'darwin':
      // For macOS, try different formats - .icns for production, PNG for development
      if (isProd) {
        iconPath = path.join(iconBasePath, theme, 'desktop', 'macos', 'icon.icns')
      } else {
        // In development, try PNG first as it's more reliable
        const pngPath = path.join(iconBasePath, theme, 'desktop', 'linux', 'icon-512x512.png')
        const icnsPath = path.join(iconBasePath, theme, 'desktop', 'macos', 'icon.icns')
        iconPath = fs.existsSync(pngPath) ? pngPath : icnsPath
      }
      break
    case 'win32':
      iconPath = path.join(iconBasePath, theme, 'desktop', 'windows', 'icon.ico')
      break
    default: // linux
      iconPath = path.join(iconBasePath, theme, 'desktop', 'linux', 'icon-512x512.png')
      break
  }
  
  // Debug logging
  console.log('Icon path:', iconPath)
  console.log('Icon exists:', fs.existsSync(iconPath))
  console.log('__dirname:', __dirname)
  console.log('Theme:', theme)
  console.log('Platform:', platform)
  
  // If the theme-specific icon doesn't exist, fall back to the resources folder
  if (!fs.existsSync(iconPath)) {
    const fallbackPath = platform === 'darwin' 
      ? path.join(__dirname, '..', 'resources', 'icon.icns')
      : path.join(__dirname, '..', 'resources', 'icon.ico')
    
    console.log('Fallback path:', fallbackPath)
    console.log('Fallback exists:', fs.existsSync(fallbackPath))
    
    if (fs.existsSync(fallbackPath)) {
      return fallbackPath
    }
  }
  
  return iconPath
}

;(async () => {
  await app.whenReady()
  
  // Set app name for dock/taskbar
  app.setName('Hermes')

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    icon: getIconPath(),
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
  
  // Set dock icon for macOS
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(getIconPath())
  }
  
  // Update icon when system theme changes
  nativeTheme.on('updated', () => {
    const iconPath = getIconPath()
    mainWindow.setIcon(iconPath)
    if (process.platform === 'darwin' && app.dock) {
      app.dock.setIcon(iconPath)
    }
  })
})()

app.on('window-all-closed', () => {
  cleanupShortcuts()
  app.quit()
})
