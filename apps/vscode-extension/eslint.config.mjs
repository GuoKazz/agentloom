import js from '@eslint/js'
import typescriptEslint from 'typescript-eslint'

export default [
  {
    files: ['**/*.ts'],
    ignores: ['**/dist/**', '**/node_modules/**']
  },
  js.configs.recommended,
  ...typescriptEslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' }
      ],
      'no-unused-vars': 'off'
    }
  }
]
