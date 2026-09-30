/**
 * Extension-wide constants. Keeping IDs and paths here prevents drift
 * between source, package.json contributes, and tests.
 */
export const DISPLAY_NAME = 'AgentLoom'

export const COMMANDS = {
  helloWorld: 'agentloom.helloWorld',
  openWebview: 'agentloom.openWebview'
} as const

/** Stable webview viewType used by VS Code WebviewPanelSerializer (future-proof). */
export const WEBVIEW_VIEW_TYPE = 'agentloom.webview'

/**
 * Port the webview dev server is expected to listen on. The extension reads
 * `process.env.WEBVIEW_DEV_PORT` at runtime; if set, we treat it as dev mode
 * and route the webview to `http://127.0.0.1:${port}` via portMapping.
 *
 * This is the value the root `.vscode/launch.json` injects for the Dev
 * configuration. The constant exists only so tests / scripts can reference a
 * single source of truth.
 */
export const DEFAULT_WEBVIEW_DEV_PORT = 5173
