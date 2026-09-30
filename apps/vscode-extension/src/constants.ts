/**
 * Extension-wide constants. Keeping IDs and paths here prevents drift
 * between source, package.json contributes, and tests.
 */
export const DISPLAY_NAME = 'AgentLoom';

export const COMMANDS = {
	helloWorld: 'agentloom.helloWorld',
	openWebview: 'agentloom.openWebview',
} as const;

/** Stable webview viewType used by VS Code WebviewPanelSerializer (future-proof). */
export const WEBVIEW_VIEW_TYPE = 'agentloom.webview';

/** Path relative to extension root where `build-webview.mjs --dev` writes the live vite port. */
export const DEV_PORT_MARKER = 'dist/webview/.dev-port';
