import { defineConfig } from 'tsup'

const isProd = process.env.NODE_ENV === 'production'

/**
 * Build the platform core as an ESM library with TypeScript types.
 *
 *   dist/index.js     — runtime
 *   dist/index.d.ts   — public type surface
 *
 * Plugins (@agentloom/*) and the VS Code extension consume this. Keep
 * the export surface small and tree-shake friendly; tests verify the
 * registry / event-bus / host lifecycle.
 */

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'es2022',
  platform: 'neutral',
  sourcemap: true,
  minify: isProd,
  dts: true,
  clean: true
})