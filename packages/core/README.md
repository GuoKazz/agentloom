# @agentloom/core

The AgentLoom platform runtime — the core node library that hosts plugins.

## What's in here

- **`Host`** — top-level orchestrator. Bundles a plugin registry, event bus,
  storage, and configuration.
- **`Plugin`** — the interface every plugin implements.
- **`EventBus`** — synchronous pub/sub between plugins (with isolated error
  handling so one bad listener can't take down the host).
- **`Storage`** — process-local key-value store, shared across plugins.
- **`Logger`** — leveled logger that prefixes lines with the plugin id.

## Quick start

```ts
import { Host, type Plugin } from '@agentloom/core'

const host = new Host()

const greeter: Plugin = {
  meta: { id: 'demo.greeter', name: 'Greeter', version: '0.1.0' },
  activate(ctx) {
    ctx.log.info('hello')
    ctx.events.on('file:saved', () => ctx.log.info('saw a save'))
  }
}

host.load(greeter)
await host.activateAll()
```

## Scripts

| Script           | What it does                                  |
| ---------------- | --------------------------------------------- |
| `pnpm run build` | Bundle ESM + types via `tsup`                |
| `pnpm run dev`   | `tsup --watch` rebuild on save               |
| `pnpm typecheck` | `tsc --noEmit`                              |
| `pnpm test`      | `vitest run` (unit tests for Host + bus)    |
| `pnpm run test:watch` | `vitest` watch mode                    |

## Status

Phase 1 — minimal but real. The Host covers register / activate / deactivate
lifecycle, event delivery, shared storage. Future work:
- Persistent storage adapter (currently in-memory only)
- Plugin discovery (load by directory / manifest)
- Versioning & dependency resolution between plugins
- Async activate timeout / cancellation