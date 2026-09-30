import * as vscode from 'vscode';
import { DISPLAY_NAME, WEBVIEW_VIEW_TYPE } from '../constants';
import { readDevPort } from './ports';
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

		const devPort = await readDevPort(vscode.workspace.fs, this.context.extensionUri);
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
