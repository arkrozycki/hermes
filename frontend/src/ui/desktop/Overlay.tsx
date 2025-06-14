import React, { useState, useEffect, useRef } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "../../components/ui/command";

import { SettingsPanel } from "./SettingsPanel";
import { SearchResults } from "./SearchResults";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

export function Overlay() {
  const [open, setOpen] = useState(false);
  const [userShowSettings, setUserShowSettings] = useState(false);
  const [query, setQuery] = useState("");
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("es");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, showSettings: authShowSettings } = useAuth();

  // Combined settings visibility - show if either auth requires it or user toggled it
  const showSettings = !isAuthenticated || userShowSettings;

  const restoreInputValue = () => {
    if (inputRef.current && query) {
      inputRef.current.value = query;
      // Trigger input event to sync CommandInput's internal state
      const inputEvent = new Event("input", { bubbles: true });
      inputRef.current.dispatchEvent(inputEvent);
    }
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
  };

  useEffect(() => {
    const toggleOverlay = () => {
      setOpen(true);
      if (isAuthenticated) {
        setUserShowSettings(false);
      }
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          restoreInputValue();
        }
      }, 0);
    };

    window.electron?.on("toggle-overlay", toggleOverlay);

    // Show command palette on first launch
    toggleOverlay();

    return () => {
      window.electron?.off("toggle-overlay", toggleOverlay);
    };
  }, [isAuthenticated]);

  // Open with Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Ctrl+K / Cmd+K to toggle
      if ((e.ctrlKey || e.metaKey) && key === "k") {
        e.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
                restoreInputValue();
              }
            }, 0);
          }
          return next;
        });
        if (isAuthenticated) {
          setUserShowSettings(false);
        }
        return;
      }

      // Ctrl+S / Cmd+S to show settings if query matches
      if (
        (e.ctrlKey || e.metaKey) &&
        key === "s" &&
        query.trim().toLowerCase() === "settings"
      ) {
        e.preventDefault();
        setUserShowSettings(true);
        return;
      }

      // Ctrl+, / Cmd+, → open settings directly
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setUserShowSettings(true);
        return;
      }

      // Ctrl+/ / Cmd+/ → swap source & target languages
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        swapLanguages();
        return;
      }

      // Enter to open settings when query is 'settings'
      if (
        open &&
        key === "enter" &&
        query.trim().toLowerCase() === "settings"
      ) {
        e.preventDefault();
        setUserShowSettings(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, query, fromLang, toLang, isAuthenticated]);

  const isQuerySettings = query.trim().toLowerCase() === "settings";

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-start z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <CommandDialog
          open={open}
          modal={false}
          onOpenChange={(value) => {
            if (value === false) {
              setOpen(false);
              window.electron?.send("hide-window");
            }
          }}
          className=""
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            e.stopPropagation(); // ensure it doesn't bubble
          }}
        >
          <div className="relative">
            {/* Draggable region - only on the left side */}
            <div
              className="absolute left-0 top-0 w-8 h-8 cursor-move"
              style={{ WebkitAppRegion: "drag" }}
            />

            <div className="absolute right-10 top-3 flex gap-1 items-center z-10">
              <select
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
                className="border-input bg-background text-foreground text-xs px-2 py-1 rounded"
                style={{ WebkitAppRegion: "no-drag" }}
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>

              <button
                onClick={swapLanguages}
                className="text-xs px-1 py-1 rounded hover:bg-muted"
                style={{ WebkitAppRegion: "no-drag" }}
              >
                ⇄
              </button>

              <select
                value={toLang}
                onChange={(e) => setToLang(e.target.value)}
                className="border-input bg-background text-foreground text-xs px-2 py-1 rounded"
                style={{ WebkitAppRegion: "no-drag" }}
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
            </div>
            {/* command input with padding to avoid overlap */}
            <CommandInput
              ref={inputRef}
              placeholder="Text to translate ..."
              onValueChange={(val) => {
                setQuery(val);
                if (isAuthenticated) {
                  setUserShowSettings(false);
                }
              }}
              style={{ WebkitAppRegion: "no-drag" }}
            />
          </div>
          <CommandList style={{ WebkitAppRegion: "no-drag" }}>
            {isQuerySettings && isAuthenticated && (
              <CommandGroup heading="Suggestions">
                <CommandItem onSelect={() => setUserShowSettings(true)}>
                  settings
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>

          {query && !isQuerySettings && !showSettings && isAuthenticated && (
            <div
              className="bg-popover text-popover-foreground mt-2 max-h-96 overflow-auto"
              style={{ WebkitAppRegion: "no-drag" }}
            >
              <SearchResults query={query} from={fromLang} to={toLang} />
            </div>
          )}

          {/* Panel drawer */}
          <div
            className={cn(
              "transition-all max-h-96 overflow-auto border-border bg-popover text-popover-foreground",
              showSettings ? "mt-2" : "hidden"
            )}
            style={{ WebkitAppRegion: "no-drag" }}
          >
            {showSettings && <SettingsPanel />}
          </div>
        </CommandDialog>
      </div>
    </div>
  );
}
