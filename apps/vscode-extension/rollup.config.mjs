import { createRequire } from 'node:module'
import { defineConfig } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')

/**
 * VS Code Extension build pipeline.
 *
 * Outputs:
 *   dist/extension.js                       — entry point declared in package.json `main`
 *   dist/test/suite/extensionTests.js       — entry point used by `vscode-test-web`
 *
 * `vscode` is provided at runtime by the extension host; it must NOT be bundled.
 * `mocha` and its CSS are loaded as side-effects from the runner; the runner itself is
 * bundled as IIFE so the test page (a static HTML in @vscode/test-web) can `mocha.run()`.
 */
export default defineConfig([
  {
    // Pass 1: extension main — ESM bundle loaded by VS Code extension host.
    // `src/extension.ts` is the single source of truth for activate/deactivate;
    // tests import it directly via the relative path `../../extension` and rollup
    // resolves it to this file (no re-export shim needed).
    input: 'src/extension.ts',
    output: {
      file: pkg.main,
      format: 'es',
      sourcemap: true,
    },
    external: ['vscode'],
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
        },
      }),
      resolve({ browser: true }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          rootDir: 'src',
          declaration: false,
          sourceMap: true,
        },
      }),
      process.env.NODE_ENV === 'production' && terser(),
    ].filter(Boolean),
  },
  {
    // Pass 2: web test bundle — IIFE because @vscode/test-web serves it via a static
    // HTML page that expects the global `mocha` to be defined before `mocha.run()`.
    input: 'src/test/suite/mochaTestRunner.ts',
    output: {
      file: 'dist/test/suite/extensionTests.js',
      format: 'iife',
      name: 'extensionTests',
      sourcemap: true,
      inlineDynamicImports: true,
    },
    external: ['vscode', 'mocha', 'mocha/mocha'],
    plugins: [
      // typescript MUST come before resolve/commonjs so the entry .ts file
      // is compiled on the `load` hook (otherwise rollup's default parser
      // tries to read it as JavaScript and throws on the `: Promise<void>`
      // return type annotation).
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: {
          rootDir: 'src',
          declaration: false,
          sourceMap: true,
        },
      }),
      resolve({ browser: true }),
      commonjs(),
      json(),
    ],
  },
])