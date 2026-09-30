import * as vscode from 'vscode'
import { COMMANDS } from '../constants'
import { WebviewPanelManager } from '../webview/panel'

/**
 * Wire the `agentloom.openWebview` command to a long-lived panel manager.
 *
 * The manager is dropped into `context.subscriptions` so its panel (if any) is
 * disposed when the extension deactivates. The command itself only calls
 * `show()` — the manager handles singleton, dev-mode probing, and HTML loading.
 */
export function registerOpenWebview(context: vscode.ExtensionContext): void {
  const manager = new WebviewPanelManager(context)
  context.subscriptions.push(manager)

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.openWebview, () => {
      void manager.show()
    })
  )
}
