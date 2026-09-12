// Tiny localStorage-backed store for the frontend-only OBE modules.
import { useEffect, useState, useSyncExternalStore } from "react";

export type LocalStore<T> = {
  initial: T;
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createLocalStore<T>(key: string, initial: T): LocalStore<T> {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (cache !== undefined) return cache;
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      cache = initial;
    }
    return cache as T;
  };

  return {
    initial,
    get: read,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(read()) : next;
      cache = resolved;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* ignore quota / private mode errors */
      }
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Reads a store safely for SSR: returns the seed until the browser has hydrated. */
export function useLocalStore<T>(store: LocalStore<T>): T {
  const value = useSyncExternalStore(store.subscribe, store.get, () => store.initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated ? value : store.initial;
}
