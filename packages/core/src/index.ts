/**
 * @agentloom/core — the AgentLoom platform runtime.
 *
 * A Host bundles a {@link PluginRegistry}, {@link EventBus}, key-value
 * {@link Storage}, and read-only {@link Config}. Plugins (separate
 * packages) register against a Host and receive a {@link PluginContext}
 * on activation.
 *
 * @example
 * ```ts
 * import { Host, type Plugin } from '@agentloom/core'
 *
 * const host = new Host()
 * const myPlugin: Plugin = {
 *   meta: { id: 'demo.greeter', name: 'Greeter', version: '0.1.0' },
 *   activate(ctx) {
 *     ctx.log.info('hello from greeter')
 *     ctx.events.emit('greeting', { who: 'world' })
 *   }
 * }
 * host.load(myPlugin)
 * await host.activateAll()
 * ```
 */

export type {
  Config,
  EventBus,
  LogLevel,
  Logger,
  Plugin,
  PluginContext,
  PluginMeta,
  Storage,
  Unsubscribe
} from './types.js'
export { PluginError } from './types.js'
export { Host, type HostOptions } from './host.js'
export { PluginRegistry } from './registry.js'
export { createEventBus, type EventBusOptions } from './event-bus.js'
export { createLogger, type LoggerOptions } from './logger.js'
export { createStorage } from './storage.js'
export { createConfig } from './config.js'