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
| [`packages/foo`](packages/foo)                          | package  | Minimal TypeScript library scaffold (Rollup + Vitest)        |
| [`packages/webview-ui`](packages/webview-ui)             | package  | Shared React webview UI consumed by the VS Code extension   |

## Development

### Prerequisites

- Node 22+
- pnpm 11+

### Install

```bash
pnpm install
```

### Develop the extension (two-step)

The VS Code extension has two watchers running during development: the webview (Vite) and the extension host code (Rollup). They are independent processes, so we run them in a terminal and then launch the Extension Host from VS Code.

**Step 1 — Terminal: start both watchers**

```bash
pnpm run dev
```

This runs `concurrently` to start:

- `pnpm --filter @agentloom/webview-ui run dev` — Vite dev server at <http://127.0.0.1:5173>
- `pnpm --filter @agentloom/vscode-extension run watch-web:rollup` — Rollup watching the extension code

Leave this terminal open. Edit any file under `packages/webview-ui/src/**` and the webview hot-reloads; edit `apps/vscode-extension/src/**` and Rollup rebuilds `dist/extension.js`.

**Step 2 — VS Code: launch the extension**

Open the repo root in VS Code and press <kbd>F5</kbd>. Pick **"Run Extension (Dev)"**.

A new VS Code window opens with the extension loaded. The webview routes to the live Vite dev server (`WEBVIEW_DEV_PORT=5173` is set in the launch config).

**Step 3 — Tear down**

Stop the VS Code debug session, then <kbd>Ctrl+C</kbd> in the terminal to stop both watchers.

### Build & verify production mode (one-step)

For a sanity check that the production build works end-to-end, pick **"Run Extension (Prod)"** in the VS Code debug picker. Its `preLaunchTask` runs `compile-web` (tsc + lint + rollup + Vite build) and launches a new window with the bundled assets — no terminal watcher needed.

### Scripts

| Script             | What it does                                                                  |
| ------------------ | ----------------------------------------------------------------------------- |
| `pnpm run dev`     | Webview (Vite) + extension host (Rollup) watchers via `concurrently`           |
| `pnpm typecheck`   | Runs each workspace package's own `typecheck` script                          |
| `pnpm run lint`    | ESLint across the tree                                                         |
| `pnpm run format`  | Prettier across the tree                                                       |
