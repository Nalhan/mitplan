module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // Add any custom rules here
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};