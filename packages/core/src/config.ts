import type { Config } from './types.js'

/** Read-only configuration view backed by a plain object. */
export function createConfig(values: Record<string, unknown> = {}): Config {
  return {
    get<T = unknown>(key: string, fallback?: T): T {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return values[key] as T
      }
      return fallback as T
    }
  }
}