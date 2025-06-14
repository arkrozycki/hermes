import { useEffect, useState } from "react";
import { debouncedTranslateText } from "../../services/translationService";

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
  /** ISO‑639‑1 source language (e.g. "en") */
  from?: string;
  /** ISO‑639‑1 target language (e.g. "es") */
  to?: string;
};

/**
 * Fetches a single Google Translate result and renders it.
 * Falls back to an error message if the API key is missing or the request fails.
 */
export function SearchResults({ query, from = "en", to = "es" }: Props) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setLoading(true);

    debouncedTranslateText(query, from, to)
      .then((text) => setTranslated(text))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
