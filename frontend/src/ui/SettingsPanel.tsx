import { useState, useEffect } from "react";

const STORAGE_KEY = "googleApiKey";

export function SettingsPanel() {
  // initialise from localStorage once on mount
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    }
    return "";
  });

  // persist every time it changes
  useEffect(() => {
    if (apiKey.trim()) {
      localStorage.setItem(STORAGE_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [apiKey]);

  return (
    <div className="p-4 space-y-4">
      <div>
        <label htmlFor="gcp-key" className="block mb-1 font-medium">
          Google Cloud&nbsp;API Key
        </label>
        <input
          id="gcp-key"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="paste key here"
          className="w-full rounded border px-3 py-2"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Your key is stored locally in the browser’s storage.
        </p>
      </div>
    </div>
  );
}
