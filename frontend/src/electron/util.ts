import { ipcMain, WebContents, WebFrameMain, IpcMainInvokeEvent } from "electron";
import { getUIPath } from "./pathResolver.js";
import { pathToFileURL } from "url";
import { AuthResponse } from "../types/auth.js";

// Define the event payload mapping
export type EventPayloadMapping = {
  'store-tokens': [AuthResponse | null];
  'get-tokens': [];
  'getStaticData': [];
  'statistics': [{ cpuUsage: number; ramUsage: number; storageData: number }];
};

// Checks if you are in development mode
export function isDev(): boolean {
    return process.env.NODE_ENV === "development";
}

// Making IPC Typesafe
export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
    key: Key,
    handler: (event: IpcMainInvokeEvent, ...args: EventPayloadMapping[Key]) => Promise<any> | any
) {
    ipcMain.handle(key, (event, ...args) => {
        if (event.senderFrame) validateEventFrame(event.senderFrame);
        return handler(event, ...(args as EventPayloadMapping[Key]));
    });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
    key: Key,
    webContents: WebContents,
    payload: EventPayloadMapping[Key][0]
) {
    webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain) {
    if (isDev() && new URL(frame.url).host === "localhost:3524") return;

    if (frame.url !== pathToFileURL(getUIPath()).toString()) throw new Error("Malicious event");
}
