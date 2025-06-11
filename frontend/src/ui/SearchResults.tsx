import { useEffect, useState } from "react";

const STORAGE_KEY = "googleApiKey";
const ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

// Simple in-memory cache for translations
const translationCache = new Map<string, string>();

const getCacheKey = (query: string, from: string, to: string): string => {
  return `${from}:${to}:${query}`;
};

type Props = {
  /** The text the user wants translated */
  query: string;
  /** ISO‑639‑1 source language (e.g. “en”) */
  from?: string;
  /** ISO‑639‑1 target language (e.g. “es”) */
  to?: string;
};

/**
 * Fetches a single Google Translate result and renders it.
 * Falls back to an error message if the API key is missing or the request fails.
 */
export function SearchResults({ query, from = "en", to = "es" }: Props) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // reset UI immediately when query changes
    setError(null);
    if (!query.trim()) {
      setTranslated(null);
      return;
    }

    const apiKey = localStorage.getItem(STORAGE_KEY);
    if (!apiKey) {
      setError("⚠️ API key not set (Settings)");
      setTranslated(null);
      return;
    }

    // Check cache first
    const cacheKey = getCacheKey(query, from, to);
    const cachedResult = translationCache.get(cacheKey);
    if (cachedResult) {
      setTranslated(cachedResult);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    // debounce actual network call
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: query,
            source: from,
            target: to,
            format: "text",
          }),
          signal: controller.signal,
        });

        const json = await res.json();
        const text =
          json?.data?.translations?.[0]?.translatedText ??
          `⚠️ ${res.status} ${res.statusText}`;
        
        // Cache successful translations (don't cache error messages)
        if (text && !text.startsWith("⚠️")) {
          translationCache.set(cacheKey, text);
        }
        
        setTranslated(text);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError("⚠️ request failed");
          setTranslated(null);
        }
      } finally {
        setLoading(false);
      }
    }, 400); // 400 ms debounce

    return () => {
      controller.abort();
      clearTimeout(id); // cancel pending debounce
    };
  }, [query, from, to]);

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Translating to <strong>{to.toUpperCase()}</strong>:&nbsp;
        <span className="italic">{query}</span>
      </p>

      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}

      {error && <p className="text-xs text-destructive-foreground">{error}</p>}

      {translated && !loading && !error && (
        <div className="rounded-md bg-muted p-3 whitespace-pre-wrap">
          {translated}
        </div>
      )}
    </div>
  );
}
