/**
 * Public types for AgentLoom plugins.
 *
 * A plugin is a self-contained capability (e.g. AI unit-test generator,
 * code-quality checker). Plugins register with a Host at startup, then
 * receive a `PluginContext` exposing the platform's services.
 */

/** Identifying metadata for a plugin. */
export interface PluginMeta {
  /** Stable, namespaced id (e.g. `"agentloom.ut-generator"`). */
  id: string
  /** Human-readable name. */
  name: string
  /** Semver of this plugin. */
  version: string
  /** Optional short description. */
  description?: string
}

/** Severity levels for log messages emitted through the platform. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Minimal logger contract. Hosts can wire to their own (VS Code, console). */
export interface Logger {
  debug(...args: unknown[]): void
  info(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}

/** Simple key-value storage scoped to the host process (in-memory). */
export interface Storage {
  get<T = unknown>(key: string): T | undefined
  set<T = unknown>(key: string, value: T): void
  delete(key: string): void
  has(key: string): boolean
  keys(): string[]
}

/** Read-only view of host-wide configuration. */
export interface Config {
  get<T = unknown>(key: string, fallback?: T): T
}

/** Handle returned by `eventBus.on` so listeners can be removed. */
export type Unsubscribe = () => void

/** Pub/sub bus exposed to plugins. */
export interface EventBus {
  on(event: string, handler: (payload: unknown) => void): Unsubscribe
  once(event: string, handler: (payload: unknown) => void): Unsubscribe
  off(event: string, handler: (payload: unknown) => void): void
  emit(event: string, payload?: unknown): void
  removeAllListeners(event?: string): void
}

/** Capabilities handed to a plugin when it activates. */
export interface PluginContext {
  /** The plugin's own metadata. */
  readonly meta: PluginMeta
  /** Structured logger, automatically prefixed with the plugin id. */
  readonly log: Logger
  /** Bus for cross-plugin communication. */
  readonly events: EventBus
  /** Key-value storage (process-local). */
  readonly storage: Storage
  /** Host configuration. */
  readonly config: Config
}

/** A unit of capability a plugin author ships. */
export interface Plugin {
  readonly meta: PluginMeta
  activate(ctx: PluginContext): void | Promise<void>
  deactivate?(): void | Promise<void>
}

/** Thrown when a plugin id is registered twice or activated twice. */
export class PluginError extends Error {
  override readonly name = 'PluginError'
}