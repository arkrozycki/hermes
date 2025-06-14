import { app, BrowserWindow, globalShortcut } from "electron";
import { ipcMainHandle, isDev } from "./util.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { getStaticData, pollResources } from "./test.js";
import path from "path";
import { fileURLToPath } from "url";
import Store from 'electron-store';
import { AuthResponse } from '../types/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const store = new Store();

// Define the event payload mapping
type EventPayloadMapping = {
  'store-tokens': [AuthResponse | null];
  'get-tokens': [];
  'getStaticData': [];
};

// Filter out specific console errors
const filterConsoleErrors = (event: any, level: number, message: string) => {
    if (message.includes("Autofill.enable") || message.includes("Autofill.setAddresses")) {
        return false;
    }
    return true;
};

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 500,
        icon: path.join(__dirname, "./ui/assets/hermes-logo.png"),
        show: false,
        frame: false,
        backgroundColor: '#00000000', // Important: fully transparent
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        movable: true, // Enable window movement
        webPreferences: {
            preload: getPreloadPath(),
        }
    });
    mainWindow.setOpacity(0);

    // Handle window blur (clicking away)
    mainWindow.on('blur', () => {
        if (mainWindow) {
            mainWindow.hide();
            mainWindow.setOpacity(0);
        }
    });

    // Handle close button
    mainWindow.on('close', (event) => {
        event.preventDefault();
        if (mainWindow) {
            mainWindow.hide();
            mainWindow.setOpacity(0);
        }
    });

    // Handle hide-window event from renderer
    mainWindow.webContents.on('ipc-message', (event, channel) => {
        if (channel === 'hide-window' && mainWindow) {
            mainWindow.hide();
            mainWindow.setOpacity(0);
        }
    });

    // Handle token storage
    ipcMainHandle('store-tokens', (_, tokens) => {
        store.set('auth-tokens', tokens);
    });

    ipcMainHandle('get-tokens', () => {
        return store.get('auth-tokens');
    });

    ipcMainHandle('getStaticData', () => {
        return getStaticData();
    });

    // Add console filter
    mainWindow.webContents.on('console-message', filterConsoleErrors);

    // console.log("isDev", isDev());

    mainWindow.once("ready-to-show", () => {
        // Intentionally left blank to keep window hidden until hotkey
        if (isDev()) {
          mainWindow!.webContents.openDevTools({ mode: "detach" }); // use ! here
        }
      });

    if (isDev()) {
        mainWindow.loadURL("http://localhost:3524").then(() => mainWindow?.hide());
    } else {
        mainWindow.loadFile(getUIPath()).then(() => mainWindow?.hide());
    }

    pollResources(mainWindow);

    const success = globalShortcut.register("CommandOrControl+K", () => {
        if (!mainWindow) return;
        if (mainWindow.isVisible()) {
            mainWindow.hide();
            mainWindow.setOpacity(0);
        } else {
            mainWindow.show();
            mainWindow.setOpacity(1);
            mainWindow.focus();
            mainWindow.webContents.send("toggle-overlay");
        }
    });

    if (!success) {
        console.error("Global shortcut registration failed");
    }

    if (process.platform === "darwin") {
        app.dock.hide();
    }
});

// app.on("window-all-closed", (e) => {
//     e.preventDefault();
// });

app.on("window-all-closed", () => {
    // no-op or just comment explaining why we're skipping closing
  });
