import * as vscode from 'vscode';

/**
 * Build the HTML string to assign to a webview's `.html` property.
 *
 * - **Production** (`devPort === undefined`): read the bundled `index.html`
 *   that `pnpm --filter @agentloom/webview-ui build` emitted under
 *   `dist/webview/`. Asset paths are rewritten through `webview.asWebviewUri`,
 *   and a strict CSP is injected.
 *
 * - **Development** (`devPort` set): generate an inline HTML that loads the
 *   Vite dev server directly (`/@vite/client` + `/src/main.tsx`). This avoids
 *   needing a written-to-disk build artefact during dev (Vite serves from
 *   memory in `vite dev` mode) and gives us HMR for free.
 *
 * Kept side-effect-free beyond the file read so it can be unit-tested with a
 * stub `Webview` and stub `FileSystem`.
 */
export async function buildHtml(
	webview: vscode.Webview,
	indexHtmlUri: vscode.Uri,
	devPort: number | undefined,
): Promise<string> {
	if (devPort !== undefined) {
		return buildDevHtml(webview, devPort);
	}

	const raw = await vscode.workspace.fs.readFile(indexHtmlUri);
	let html = new TextDecoder().decode(raw);

	// Resolve any relative src/href through asWebviewUri so production loads work.
	html = rewriteRelativeAssets(html, webview, indexHtmlUri);

	// CSP: production is strict.
	const csp = buildCsp(webview.cspSource, undefined);
	html = html.replace(/<head>/, `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);

	return html;
}

/**
 * Dev-mode HTML: a minimal shell that loads the React app from the live Vite
 * dev server. Vite's HMR client (`/@vite/client`) is injected first so any
 * source edit under `packages/webview-ui/src/**` propagates without reload.
 */
function buildDevHtml(webview: vscode.Webview, devPort: number): string {
	const origin = `http://127.0.0.1:${devPort}`;
	const csp = buildCsp(webview.cspSource, devPort);
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta http-equiv="Content-Security-Policy" content="${csp}">
	<title>AgentLoom</title>
</head>
<body>
	<div id="root"></div>
	<script type="module" src="${origin}/@vite/client"></script>
	<script type="module" src="${origin}/src/main.tsx"></script>
</body>
</html>`;
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
			`script-src 'self' ${cspSource} ${origin} 'unsafe-inline' 'unsafe-eval'`,
			`style-src 'self' ${cspSource} ${origin} 'unsafe-inline'`,
			`img-src ${cspSource} ${origin} data:`,
			`font-src ${cspSource} ${origin} data:`,
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