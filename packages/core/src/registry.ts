import { PluginError, type Plugin } from './types.js'

/**
 * In-memory plugin registry. Owns the set of known plugins and is the
 * source of truth for `Host.activateAll`. Idempotency is enforced:
 * registering the same id twice raises `PluginError`.
 */
export class PluginRegistry {
  private readonly plugins = new Map<string, Plugin>()

  /** Register a plugin. Throws if the id already exists. */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.meta.id)) {
      throw new PluginError(`plugin "${plugin.meta.id}" is already registered`)
    }
    this.plugins.set(plugin.meta.id, plugin)
  }

  /** Remove a plugin by id. No-op if not present. */
  unregister(id: string): void {
    this.plugins.delete(id)
  }

  /** Look up a plugin by id. */
  get(id: string): Plugin | undefined {
    return this.plugins.get(id)
  }

  /** Snapshot of all registered plugins in registration order. */
  list(): Plugin[] {
    return [...this.plugins.values()]
  }

  /** Number of registered plugins. */
  get size(): number {
    return this.plugins.size
  }

  /** Whether a plugin with this id is registered. */
  has(id: string): boolean {
    return this.plugins.has(id)
  }
}