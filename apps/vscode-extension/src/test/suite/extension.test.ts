import * as assert from 'assert'
import * as vscode from 'vscode'
import * as myExtension from '../../extension'

suite('Web Extension Test Suite', () => {
  test('Sample test', () => {
    assert.ok(myExtension, 'extension module should be importable')
    assert.strictEqual(-1, [1, 2, 3].indexOf(5))
    assert.strictEqual(-1, [1, 2, 3].indexOf(0))
  })

  test('VS Code API is available', () => {
    assert.ok(vscode, 'vscode module should be available in web extension host')
  })
})
