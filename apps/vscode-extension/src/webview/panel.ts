import * as vscode from 'vscode';
import { DEFAULT_WEBVIEW_DEV_PORT, DISPLAY_NAME, WEBVIEW_VIEW_TYPE } from '../constants';
import { buildHtml } from './html';

/**
 * Singleton manager for the AgentLoom webview panel.
 *
 * Re-invoking `show()` while the panel is alive just reveals it instead of
 * stacking duplicate tabs. When the user closes the panel the slot is cleared,
 * so the next invocation creates a fresh one (with fresh dev-mode probing).
 *
 * Lifecycle is owned by the caller: drop the returned disposable into
 * `context.subscriptions` so the panel goes away on extension deactivation.
 *
 * Dev mode is signalled by the `WEBVIEW_DEV_PORT` env var (set by the root
 * `.vscode/launch.json` Dev configuration). When present, we point the
 * webview at the live vite dev server; otherwise we serve the bundled HTML
 * that `pnpm --filter @agentloom/webview-ui build` emitted into
 * `apps/vscode-extension/dist/webview`.
 */
export class WebviewPanelManager implements vscode.Disposable {
	private panel: vscode.WebviewPanel | undefined;

	constructor(private readonly context: vscode.ExtensionContext) {}

	/** Reveal the existing panel, or create one and load the built webview. */
	async show(): Promise<void> {
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.One);
			return;
		}

		const devPort = readDevPort();
		if (devPort !== undefined) {
			console.log(`[${DISPLAY_NAME}] dev mode: routing localhost:${devPort} to vite`);
		}

		const baseOptions: vscode.WebviewPanelOptions & vscode.WebviewOptions = {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
		};
		const panelOptions: vscode.WebviewPanelOptions & vscode.WebviewOptions = devPort !== undefined
			? { ...baseOptions, portMapping: [{ webviewPort: devPort, extensionHostPort: devPort }] }
			: baseOptions;

		const panel = vscode.window.createWebviewPanel(
			WEBVIEW_VIEW_TYPE,
			DISPLAY_NAME,
			vscode.ViewColumn.One,
			panelOptions,
		);

		const indexHtml = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'index.html');
		panel.webview.html = await buildHtml(panel.webview, indexHtml, devPort);

		panel.onDidDispose(() => {
			if (this.panel === panel) {
				this.panel = undefined;
			}
		});

		this.panel = panel;
	}

	dispose(): void {
		this.panel?.dispose();
		this.panel = undefined;
	}
}

/**
 * Read the dev port from the environment. Returns `undefined` when the env var
 * is unset, empty, or non-numeric — in every one of those cases the caller
 * falls back to the production HTML loader.
 */
function readDevPort(): number | undefined {
	const raw = process.env.WEBVIEW_DEV_PORT;
	if (!raw) return undefined;
	const n = Number(raw);
	return Number.isFinite(n) && n > 0 ? n : DEFAULT_WEBVIEW_DEV_PORT;
}