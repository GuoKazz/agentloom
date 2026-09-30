import { createLogger } from './logger.js'
import { createStorage } from './storage.js'
import { createEventBus } from './event-bus.js'
import { createConfig } from './config.js'
import { PluginRegistry } from './registry.js'
import { PluginError, type Config, type EventBus, type Plugin, type PluginContext, type Storage } from './types.js'

export interface HostOptions {
  /** Initial configuration values. */
  config?: Record<string, unknown>
  /** Initial storage values. */
  storage?: Record<string, unknown>
  /** Event-bus error sink for handler exceptions. */
  onEventError?: (err: unknown, event: string) => void
}

/**
 * Top-level orchestrator for an AgentLoom runtime. Aggregates the registry,
 * event bus, storage, and configuration, and exposes lifecycle helpers for
 * plugins. Hosts are single-tenant: every consumer (extension host, webview
 * bridge, future embedded CLI) gets its own Host instance.
 */
export class Host {
  private readonly registry: PluginRegistry
  private readonly events_: EventBus
  private readonly storage_: Storage
  private readonly config_: Config
  private readonly activated = new Set<string>()

  constructor(opts: HostOptions = {}) {
    this.registry = new PluginRegistry()
    this.events_ = createEventBus({ onError: opts.onEventError })
    this.storage_ = createStorage(opts.storage)
    this.config_ = createConfig(opts.config)
  }

  /** Event bus shared with all plugins. */
  get events(): EventBus {
    return this.events_
  }

  /** Plugin registry. */
  get plugins(): PluginRegistry {
    return this.registry
  }

  /** Storage shared with all plugins. */
  get storage(): Storage {
    return this.storage_
  }

  /** Configuration shared with all plugins. */
  get config(): Config {
    return this.config_
  }

  /** Load (register) a plugin. Alias of {@link PluginRegistry.register}. */
  load(plugin: Plugin): void {
    this.registry.register(plugin)
  }

  /** Activate a previously loaded plugin by id. */
  async activate(id: string): Promise<void> {
    if (this.activated.has(id)) {
      throw new PluginError(`plugin "${id}" is already activated`)
    }
    const plugin = this.registry.get(id)
    if (!plugin) {
      throw new PluginError(`plugin "${id}" is not registered`)
    }
    const ctx = this.contextFor(plugin)
    await plugin.activate(ctx)
    this.activated.add(id)
  }

  /** Deactivate an activated plugin. No-op if not active. */
  async deactivate(id: string): Promise<void> {
    if (!this.activated.has(id)) return
    const plugin = this.registry.get(id)
    if (plugin?.deactivate) {
      await plugin.deactivate()
    }
    this.activated.delete(id)
  }

  /** Activate every registered plugin in registration order. */
  async activateAll(): Promise<void> {
    for (const plugin of this.registry.list()) {
      if (!this.activated.has(plugin.meta.id)) {
        await this.activate(plugin.meta.id)
      }
    }
  }

  /** Deactivate every active plugin in reverse-registration order. */
  async deactivateAll(): Promise<void> {
    const ids = [...this.activated]
    for (const id of ids.reverse()) {
      await this.deactivate(id)
    }
  }

  private contextFor(plugin: Plugin): PluginContext {
    const log = createLogger({ prefix: plugin.meta.id })
    return {
      meta: plugin.meta,
      log,
      events: this.events_,
      storage: this.storage_,
      config: this.config_
    }
  }
}