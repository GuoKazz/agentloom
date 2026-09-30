import { describe, it, expect, vi } from 'vitest'
import { Host, PluginError, type Plugin } from '../src'

function makePlugin(overrides: Partial<Plugin> & Pick<Plugin, 'meta' | 'activate'>): Plugin {
  return overrides as Plugin
}

describe('Host', () => {
  it('registers and activates a plugin', async () => {
    const host = new Host()
    const activate = vi.fn()

    const plugin = makePlugin({
      meta: { id: 'demo.a', name: 'A', version: '0.0.1' },
      activate
    })

    host.load(plugin)
    await host.activate('demo.a')

    expect(activate).toHaveBeenCalledOnce()
    expect(host.plugins.has('demo.a')).toBe(true)
  })

  it('rejects duplicate registration with PluginError', () => {
    const host = new Host()
    const plugin = makePlugin({
      meta: { id: 'demo.dup', name: 'Dup', version: '0.0.1' },
      activate: () => {}
    })

    host.load(plugin)
    expect(() => host.load(plugin)).toThrow(PluginError)
  })

  it('rejects double activation with PluginError', async () => {
    const host = new Host()
    host.load(
      makePlugin({
        meta: { id: 'demo.2x', name: '2x', version: '0.0.1' },
        activate: () => {}
      })
    )
    await host.activate('demo.2x')
    await expect(host.activate('demo.2x')).rejects.toBeInstanceOf(PluginError)
  })

  it('activateAll activates every registered plugin in order', async () => {
    const host = new Host()
    const order: string[] = []

    host.load(
      makePlugin({
        meta: { id: 'demo.first', name: 'First', version: '0.0.1' },
        activate: () => {
          order.push('first')
        }
      })
    )
    host.load(
      makePlugin({
        meta: { id: 'demo.second', name: 'Second', version: '0.0.1' },
        activate: () => {
          order.push('second')
        }
      })
    )

    await host.activateAll()
    expect(order).toEqual(['first', 'second'])
  })

  it('deactivateAll tears down in reverse order', async () => {
    const host = new Host()
    const order: string[] = []

    host.load(
      makePlugin({
        meta: { id: 'demo.first', name: 'First', version: '0.0.1' },
        activate: () => {},
        deactivate: () => {
          order.push('first-down')
        }
      })
    )
    host.load(
      makePlugin({
        meta: { id: 'demo.second', name: 'Second', version: '0.0.1' },
        activate: () => {},
        deactivate: () => {
          order.push('second-down')
        }
      })
    )

    await host.activateAll()
    await host.deactivateAll()

    expect(order).toEqual(['second-down', 'first-down'])
  })

  it('delivers events between plugins through the shared bus', async () => {
    const host = new Host()
    const received: unknown[] = []

    host.load(
      makePlugin({
        meta: { id: 'demo.observer', name: 'Observer', version: '0.0.1' },
        activate(ctx) {
          ctx.events.on('ping', (payload) => received.push(payload))
        }
      })
    )
    host.load(
      makePlugin({
        meta: { id: 'demo.announcer', name: 'Announcer', version: '0.0.1' },
        activate(ctx) {
          ctx.events.emit('ping', { hi: 'there' })
        }
      })
    )

    await host.activateAll()
    expect(received).toEqual([{ hi: 'there' }])
  })

  it('shares storage across plugins', async () => {
    const host = new Host({ storage: { seed: 1 } })

    host.load(
      makePlugin({
        meta: { id: 'demo.writer', name: 'Writer', version: '0.0.1' },
        activate(ctx) {
          ctx.storage.set('written', 'yes')
        }
      })
    )
    host.load(
      makePlugin({
        meta: { id: 'demo.reader', name: 'Reader', version: '0.0.1' },
        activate(ctx) {
          expect(ctx.storage.get<string>('written')).toBe('yes')
          expect(ctx.storage.get<number>('seed')).toBe(1)
        }
      })
    )

    await host.activateAll()
  })

  it('forwards event handler errors to the host error sink', async () => {
    const onEventError = vi.fn()
    const host = new Host({ onEventError })

    host.load(
      makePlugin({
        meta: { id: 'demo.bad', name: 'Bad', version: '0.0.1' },
        activate(ctx) {
          ctx.events.on('boom', () => {
            throw new Error('kaboom')
          })
          ctx.events.emit('boom')
        }
      })
    )

    await host.activate('demo.bad')

    expect(onEventError).toHaveBeenCalledOnce()
    expect(onEventError.mock.calls[0]?.[1]).toBe('boom')
  })
})