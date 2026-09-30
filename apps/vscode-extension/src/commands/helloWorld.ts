import * as vscode from 'vscode'
import { COMMANDS, DISPLAY_NAME } from '../constants'

/** Register the legacy hello-world command. Thin shim over vscode.window. */
export function registerHelloWorld(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.helloWorld, () => {
      void vscode.window.showInformationMessage(
        `Hello World from ${DISPLAY_NAME} in a web extension host!`
      )
    })
  )
}
