"use client";

import * as React from "react";

const STORAGE_KEY = "caption-studio.deepgram-key";
const EVENT = "caption-studio:deepgram-key-change";

export function getDeepgramKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setDeepgramKey(key: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (key && key.trim().length > 0) {
      window.localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // ignore
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useDeepgramKey(): [string | null, (k: string | null) => void] {
  const key = React.useSyncExternalStore(
    subscribe,
    getDeepgramKey,
    () => null,
  );

  const update = React.useCallback((next: string | null) => {
    setDeepgramKey(next);
  }, []);

  return [key, update];
}

export const DEEPGRAM_KEY_HEADER = "x-deepgram-key";
