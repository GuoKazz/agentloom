import * as vscode from 'vscode'
import { DISPLAY_NAME } from './constants'
import { registerHelloWorld } from './commands/helloWorld'
import { registerOpenWebview } from './commands/openWebview'

/** Extension entry point — wires every command and lets them own their lifecycle. */
export function activate(context: vscode.ExtensionContext): void {
  console.log(`[${DISPLAY_NAME}] activate: enter`)

  try {
    registerHelloWorld(context)
    console.log(`[${DISPLAY_NAME}] activate: helloWorld registered`)
  } catch (err) {
    console.error(`[${DISPLAY_NAME}] activate: helloWorld FAILED`, err)
  }

  try {
    registerOpenWebview(context)
    console.log(`[${DISPLAY_NAME}] activate: openWebview registered`)
  } catch (err) {
    console.error(`[${DISPLAY_NAME}] activate: openWebview FAILED`, err)
  }

  console.log(`[${DISPLAY_NAME}] activate: done`)
}

export function deactivate(): void {
  // Each module owns its own disposables via context.subscriptions.
}
