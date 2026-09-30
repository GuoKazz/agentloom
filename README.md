# agentloom

> Multi-plugin agent platform — a core node library plus shared packages that power agent software across web and VS Code webview surfaces.
> Phase 1 focus: AI-generated unit tests and code-quality checks.

## Topics

`agents` · `ai-agents` · `vscode-extension` · `webview` · `monorepo` · `pnpm` · `code-quality` · `unit-testing`

## Workspace

| Path                                       | Kind     | Description                                                  |
| ------------------------------------------ | :------- | :----------------------------------------------------------- |
| [`apps/gui`](apps/gui)                                  | app      | Vite + React desktop-style GUI                               |
| [`apps/vscode-extension`](apps/vscode-extension)         | app      | VS Code extension with embedded webview panel                |
| [`packages/webview-ui`](packages/webview-ui)             | package  | Shared React webview UI consumed by the VS Code extension   |

## Development

### Prerequisites

- Node 22+
- pnpm 11+

### Install

```bash
pnpm install
```

### Develop the extension (recommended: two terminals)

The VS Code extension has two independent watchers during development:

- **Vite** serves the React webview with HMR at <http://127.0.0.1:5173>
- **tsup** watches the extension host code and rebuilds `dist/extension.js`

They are decoupled — one failing doesn't take the other down, and each has its own log stream. We run them in two separate terminals so each output stays readable.

**Terminal 1 — webview**

```bash
pnpm run dev:webview
# → vite ready in ~400ms
# → http://127.0.0.1:5173/
```

**Terminal 2 — extension host**

```bash
pnpm run dev:extension
# → tsup watching src/**/*.ts
# → created dist/extension.js in <1s
```

> **One-key alternative inside VS Code**: <kbd>Ctrl+Shift+P</kbd> → "Tasks: Run Task" → **"dev: both"** opens both watchers in two separate dedicated terminal panels (one task per panel).

**VS Code — launch**

Open the repo root in VS Code and press <kbd>F5</kbd>. Pick **"Run Extension (Dev)"**.

A new VS Code window opens with the extension loaded. The webview iframes the live Vite dev server (the `WEBVIEW_DEV_PORT=5173` env var in `.vscode/launch.json` makes the extension point at it).

**Tear down**

Stop the VS Code debug session, then <kbd>Ctrl+C</kbd> in each terminal.

> If you'd rather see both streams interleaved in one terminal, `pnpm run dev` runs them via `concurrently`. Trade-off: a noisy single stream vs. two quiet ones.

### Build & verify production mode (one-step)

For a sanity check that the production build works end-to-end, pick **"Run Extension (Prod)"** in the VS Code debug picker. Its `preLaunchTask` runs `compile-web` (tsc + lint + tsup + Vite build) and launches a new window with the bundled assets — no terminal watcher needed.

### Scripts

| Script                  | What it does                                                                  |
| ----------------------- | ----------------------------------------------------------------------------- |
| `pnpm run dev:webview`  | Vite dev server for the webview (port 5173)                                   |
| `pnpm run dev:extension`| tsup watch for the extension host code                                         |
| `pnpm run dev`          | Both watchers in one terminal (via `concurrently`)                            |
| `pnpm typecheck`        | Runs each workspace package's own `typecheck` script                          |
| `pnpm run lint`         | ESLint across the tree                                                         |
| `pnpm run format`       | Prettier across the tree                                                       |
