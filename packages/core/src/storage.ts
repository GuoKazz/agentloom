import type { Storage } from './types.js'

/**
 * In-memory key-value store. Suitable for ephemeral plugin state within
 * a single host process. Persistent storage is out of scope for the core;
 * hosts (e.g. the VS Code extension) layer that on top if they need it.
 */
export function createStorage(initial: Record<string, unknown> = {}): Storage {
  const map = new Map<string, unknown>(Object.entries(initial))
  return {
    get<T = unknown>(key: string): T | undefined {
      return map.get(key) as T | undefined
    },
    set<T = unknown>(key: string, value: T): void {
      map.set(key, value)
    },
    delete(key: string): void {
      map.delete(key)
    },
    has(key: string): boolean {
      return map.has(key)
    },
    keys(): string[] {
      return [...map.keys()]
    }
  }
}