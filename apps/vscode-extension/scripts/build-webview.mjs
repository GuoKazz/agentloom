#!/usr/bin/env node
/**
 * Build (or serve) the @agentloom/webview-ui package and sync its output into
 * apps/vscode-extension/dist/webview so the extension can serve it via
 * `webview.asWebviewUri()`.
 *
 * Modes:
 *   node scripts/build-webview.mjs            # production build (one-shot)
 *   node scripts/build-webview.mjs --dev      # start vite dev server (HMR)
 *
 * In dev mode the script writes dist/webview/.dev-port so src/extension.ts
 * can detect the running server and set up webview.options.portMapping.
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const target = resolve(root, 'dist/webview');
const DEV_PORT = 5173;

async function copyWebviewOutput() {
  // Resolve the sibling package via the workspace lockfile rather than guessing paths.
  const webviewEntry = require.resolve('@agentloom/webview-ui/package.json', { paths: [root] });
  const webviewDist = resolve(dirname(webviewEntry), 'dist');

  await mkdir(target, { recursive: true });
  // Mirror the bundle into the extension's dist so it can be packaged and served.
  await cp(webviewDist, target, { recursive: true, force: true });
  console.log(`[build-webview] copied ${webviewDist} → ${target}`);
}

async function writeDevMarker() {
  await mkdir(target, { recursive: true });
  await writeFile(resolve(target, '.dev-port'), String(DEV_PORT), 'utf8');
  console.log(`[build-webview] dev server expected on http://127.0.0.1:${DEV_PORT}`);
}

async function main() {
  const dev = process.argv.includes('--dev');

  if (!dev) {
    // ----- production mode: one-shot vite build, then copy -----
    await rm(target, { recursive: true, force: true });

    const args = ['--filter', '@agentloom/webview-ui', 'run', 'build'];
    const child = spawn('pnpm', args, {
      stdio: 'inherit',
      cwd: resolve(root, '../..'),
      shell: true,
    });

    child.on('exit', async (code) => {
      if (code !== 0) process.exit(code ?? 1);
      try {
        await copyWebviewOutput();
      } catch (err) {
        console.error('[build-webview] failed to copy webview output:', err);
        process.exit(1);
      }
    });
    return;
  }

  // ----- dev mode: start vite dev server, do NOT copy dist -----
  await mkdir(target, { recursive: true });
  await writeDevMarker();

  // Delegate to vite directly via pnpm. shell:true so Windows resolves pnpm.cmd.
  const args = ['--filter', '@agentloom/webview-ui', 'run', 'dev'];
  const child = spawn('pnpm', args, {
    stdio: 'inherit',
    cwd: resolve(root, '../..'),
    shell: true,
  });

  const shutdown = (signal) => {
    console.log(`\n[build-webview] received ${signal}, stopping vite dev server…`);
    child.kill(signal);
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('[build-webview] unexpected error:', err);
  process.exit(1);
});