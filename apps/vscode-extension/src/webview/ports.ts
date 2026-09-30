import * as vscode from 'vscode';
import { DEV_PORT_MARKER } from '../constants';

/**
 * Probe for the live vite dev server port left by `scripts/build-webview.mjs --dev`.
 *
 * Returns `undefined` whenever the marker is absent, unreadable, or contains a
 * non-positive integer — in every one of those cases the caller falls back to
 * the production HTML loader.
 */
export async function readDevPort(
	fs: typeof vscode.workspace.fs,
	rootUri: vscode.Uri,
): Promise<number | undefined> {
	try {
		const raw = await fs.readFile(vscode.Uri.joinPath(rootUri, DEV_PORT_MARKER));
		const n = Number(new TextDecoder().decode(raw).trim());
		return Number.isFinite(n) && n > 0 ? n : undefined;
	} catch {
		return undefined;
	}
}
