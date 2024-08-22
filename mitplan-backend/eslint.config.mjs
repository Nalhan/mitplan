import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json', // Make sure this points to your tsconfig.json
      },
      globals: {
        ...globals.node,
        __dirname: 'readonly',
        process: 'readonly',
        Express: 'readonly',
        NodeJS: 'readonly',
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      // General
      'no-console': 'off', // Allow console for backend logging
      'eqeqeq': 'error',
      'curly': 'error',
      'no-unused-vars': 'off', // TypeScript rule is used instead
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{js,ts}'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
];