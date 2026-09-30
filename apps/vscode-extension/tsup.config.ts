import { defineConfig } from 'tsup';

/**
 * Build pipeline for the VS Code extension.
 *
 * Two passes (run in one `tsup` invocation):
 *   1. `extension`        — ESM bundle loaded by the VS Code extension host
 *                           (`main` in package.json). Runs in Node, must NOT
 *                           bundle `vscode` (the host provides it at runtime).
 *   2. `extensionTests`   — IIFE bundle loaded by `@vscode/test-web` via a
 *                           static HTML page that expects `mocha` defined
 *                           globally before `mocha.run()`.
 *
 * Type checking is done separately by `pnpm typecheck` (tsc --noEmit).
 * tsup uses esbuild which strips types without checking.
 */

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig([
	{
		name: 'extension',
		entry: { extension: 'src/extension.ts' },
		outDir: 'dist',
		format: ['esm'],
		target: 'es2022',
		platform: 'node',
		external: ['vscode'],
		sourcemap: true,
		minify: isProd,
		define: {
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
		},
		clean: false,
	},
	{
		name: 'test',
		entry: { extensionTests: 'src/test/suite/mochaTestRunner.ts' },
		outDir: 'dist/test/suite',
		format: ['iife'],
		globalName: 'extensionTests',
		// tsup appends '.global' to IIFE output filenames by convention; the
		// package.json `test` script reads the `.global.js` filename.
		clean: true,
		target: 'es2022',
		platform: 'browser',
		external: ['vscode', 'mocha', 'mocha/mocha'],
		sourcemap: true,
	},
]);