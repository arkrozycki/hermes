import { app, BrowserWindow, globalShortcut } from "electron";
import { ipcMainHandle, isDev } from "./util.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { getStaticData, pollResources } from "./test.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

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
        webPreferences: {
            preload: getPreloadPath(),
        }
    });
    mainWindow.setOpacity(0);

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

    ipcMainHandle("getStaticData", () => {
        return getStaticData();
    });

    const success = globalShortcut.register("CommandOrControl+K", () => {
        if (!mainWindow) return;
        if (mainWindow.isVisible()) {
            mainWindow.hide();
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
