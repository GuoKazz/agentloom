import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Vite config for the shared webview UI.
//
// In a monorepo, this package is consumed by the VS Code extension and served
// from the extension's own `dist/webview` directory. To avoid a copy step in
// both dev tooling and the production build, we point `build.outDir` straight
// at the extension's output directory and let `pnpm --filter ... build` (or
// `pnpm --filter ... dev` for the dev server) own the lifecycle.
//
// Dev port defaults to 5173; in production it's irrelevant.
const __dirname = dirname(fileURLToPath(import.meta.url));
const extensionWebviewOut = resolve(__dirname, '../../apps/vscode-extension/dist/webview');

export default defineConfig({
	plugins: [react()],
	server: {
		host: '127.0.0.1',
		port: 5173,
		strictPort: false,
	},
	build: {
		outDir: extensionWebviewOut,
		emptyOutDir: true,
		sourcemap: true,
	},
});