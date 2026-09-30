import type { EventBus, Unsubscribe } from './types.js'

type Handler = (payload: unknown) => void

/**
 * Synchronous pub/sub bus. Handlers run in registration order; exceptions
 * are caught and forwarded to the optional `onError` hook (so one bad
 * listener can't take down the host).
 */
export interface EventBusOptions {
  onError?: (err: unknown, event: string) => void
}

export function createEventBus(opts: EventBusOptions = {}): EventBus {
  const handlers = new Map<string, Set<Handler>>()
  const { onError } = opts

  function add(event: string, handler: Handler, once: boolean): Unsubscribe {
    let set = handlers.get(event)
    if (!set) {
      set = new Set()
      handlers.set(event, set)
    }
    const wrapped: Handler = once
      ? (payload) => {
          set!.delete(wrapped)
          handler(payload)
        }
      : handler
    set.add(wrapped)
    return () => set!.delete(wrapped)
  }

  return {
    on(event, handler) {
      return add(event, handler, false)
    },
    once(event, handler) {
      return add(event, handler, true)
    },
    off(event, handler) {
      handlers.get(event)?.delete(handler)
    },
    emit(event, payload) {
      const set = handlers.get(event)
      if (!set) return
      // Snapshot so handlers that mutate the set (via once/off) don't skip siblings.
      for (const handler of [...set]) {
        try {
          handler(payload)
        } catch (err) {
          if (onError) onError(err, event)
          else {
            // eslint-disable-next-line no-console
            console.error(`[agentloom] event handler for "${event}" threw:`, err)
          }
        }
      }
    },
    removeAllListeners(event) {
      if (event === undefined) handlers.clear()
      else handlers.delete(event)
    }
  }
}