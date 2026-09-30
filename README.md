# agentloom

A multi-plugin agent platform. A core node library plus shared packages that power agent software across web and plugin surfaces (VS Code webview, etc.). Phase 1 focus: AI-generated unit tests and code-quality checks.

## Workspace

| Path                         | Kind     | Description                                              |
| ---------------------------- | :------- | :------------------------------------------------------- |
| [`apps/gui`](apps/gui)                  | app      | Vite + React desktop-style GUI                          |
| [`apps/vscode-extension`](apps/vscode-extension) | app | VS Code extension with embedded webview panel            |
| [`packages/foo`](packages/foo)          | package  | Minimal TypeScript library scaffold (Rollup + Vitest)   |
| [`packages/webview-ui`](packages/webview-ui) | package | Shared React webview UI consumed by the VS Code extension |
