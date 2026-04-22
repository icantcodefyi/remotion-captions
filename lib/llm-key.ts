"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "caption-studio.openai-key";
const EVENT = "caption-studio:openai-key-change";

export const OPENAI_KEY_HEADER = "x-openai-key";

export function getOpenAIKey() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setOpenAIKey(key: string | null) {
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

export function useOpenAIKey() {
  const key = useSyncExternalStore(subscribe, getOpenAIKey, () => null);
  const update = useCallback((next: string | null) => {
    setOpenAIKey(next);
  }, []);
  return [key, update] as const;
}
