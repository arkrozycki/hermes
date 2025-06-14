import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld("electron", {
  invoke: (channel: string, ...args: any[]) => {
    const validChannels = [
      "getStaticData",
      "store-tokens",
      "get-tokens",
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },
});