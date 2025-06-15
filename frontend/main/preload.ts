import { contextBridge, ipcRenderer } from 'electron'

const electron = {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => {
      // whitelist channels
      const validChannels = ['register-shortcut', 'unregister-shortcut']
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      }
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      // whitelist channels
      const validChannels = ['swap-languages']
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        const subscription = (_event: any, ...args: any[]) => func(...args)
        ipcRenderer.on(channel, subscription)
        return () => {
          ipcRenderer.removeListener(channel, subscription)
        }
      }
      return () => {}
    },
    once: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = ['swap-languages']
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (_event, ...args) => func(...args))
      }
    },
    removeListener: (channel: string, func: (...args: any[]) => void) => {
      const validChannels = ['swap-languages']
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func)
      }
    },
  },
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', electron)

export type ElectronHandler = typeof electron
