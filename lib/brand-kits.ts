"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { BrandKit } from "./types";

const STORAGE_KEY = "caption-studio.brand-kits";
const EVENT = "caption-studio:brand-kits-change";
const MAX_KITS = 20;

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBrandKit);
  } catch {
    return [];
  }
}

function write(next: BrandKit[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // quota exceeded, serialization — drop silently; UI will show the pre-fail list.
  }
}

function isBrandKit(v: unknown): v is BrandKit {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.createdAt === "number" &&
    typeof o.styleId === "string" &&
    typeof o.aspectId === "string" &&
    !!o.styleOptions &&
    typeof o.styleOptions === "object"
  );
}

let cachedSnapshot: BrandKit[] = [];
let cachedKey = "";

function getSnapshot() {
  const raw =
    typeof window === "undefined"
      ? ""
      : (window.localStorage.getItem(STORAGE_KEY) ?? "");
  if (raw === cachedKey) return cachedSnapshot;
  cachedKey = raw;
  cachedSnapshot = read();
  return cachedSnapshot;
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const EMPTY_KITS: BrandKit[] = [];
function getServerSnapshot() {
  return EMPTY_KITS;
}

export function useBrandKits() {
  const kits = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const save = useCallback((kit: BrandKit) => {
    const current = read();
    const existing = current.findIndex((k) => k.id === kit.id);
    const next =
      existing >= 0
        ? current.map((k, i) => (i === existing ? kit : k))
        : [kit, ...current].slice(0, MAX_KITS);
    write(next);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((k) => k.id !== id));
  }, []);

  const rename = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    write(read().map((k) => (k.id === id ? { ...k, name: trimmed } : k)));
  }, []);

  return { kits, save, remove, rename };
}

export function newKitId() {
  return `kit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
