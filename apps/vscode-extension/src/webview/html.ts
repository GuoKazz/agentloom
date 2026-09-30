import * as vscode from 'vscode';

/**
 * Build the HTML string to assign to a webview's `.html` property.
 *
 * Pure-ish function: the only side effect is reading the on-disk index.html via
 * the VS Code FileSystem API (so it works in the web extension host where Node's
 * `fs` is unavailable). Asset paths are rewritten through `webview.asWebviewUri`,
 * and a CSP is injected that reflects whether we're in dev mode (live vite) or
 * production (static dist).
 *
 * Kept side-effect-free beyond the read so it can be unit-tested with a stub
 * `Webview` and stub `FileSystem`.
 */
export async function buildHtml(
	webview: vscode.Webview,
	indexHtmlUri: vscode.Uri,
	devPort: number | undefined,
): Promise<string> {
	const raw = await vscode.workspace.fs.readFile(indexHtmlUri);
	let html = new TextDecoder().decode(raw);

	// Resolve any relative src/href through asWebviewUri so production loads work.
	html = rewriteRelativeAssets(html, webview, indexHtmlUri);

	// CSP: production is strict, dev relaxes to allow the vite origin + ws.
	const csp = buildCsp(webview.cspSource, devPort);
	html = html.replace(/<head>/, `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);

	return html;
}

/** Rewrite asset references in `<script>` / `<link>` to webview URIs. */
function rewriteRelativeAssets(html: string, webview: vscode.Webview, indexHtmlUri: vscode.Uri): string {
	// Match `src`/`href` pointing at any same-origin static asset — either
	// `./assets/...` (relative) or `/assets/...` / `/favicon.svg` (absolute,
	// vite default). Each is rewritten to a `vscode-webview://` URI so the
	// webview can actually fetch it.
	const webviewDir = vscode.Uri.joinPath(indexHtmlUri, '..');
	return html.replace(/(src|href)="(?:\.\/|\/)([^"]+)"/g, (_match, kind: string, target: string) => {
		// Skip external schemes (http:, https:, data:, etc.) — they don't need rewriting.
		if (/^[a-z]+:/i.test(target)) {
			return _match;
		}
		const uri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDir, target));
		return `${kind}="${uri}"`;
	});
}

function buildCsp(cspSource: string, devPort: number | undefined): string {
	if (devPort !== undefined) {
		const origin = `http://127.0.0.1:${devPort}`;
		const wsOrigin = `ws://127.0.0.1:${devPort}`;
		return [
			`default-src 'self' ${cspSource} ${origin}`,
			`script-src 'self' ${cspSource} ${origin} 'unsafe-inline'`,
			`style-src 'self' ${cspSource} ${origin} 'unsafe-inline'`,
			`connect-src ${cspSource} ${origin} ${wsOrigin}`,
		].join('; ');
	}
	// Production: lock everything down, except inline styles which the React build needs.
	return [
		`default-src 'none'`,
		`style-src ${cspSource} 'unsafe-inline'`,
		`script-src 'self' ${cspSource}`,
		`img-src ${cspSource} data:`,
		`font-src ${cspSource}`,
	].join('; ');
}
