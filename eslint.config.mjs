import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

// eslint-config-next 16 ships flat configs directly (see its `exports` map), so
// there is no @eslint/eslintrc FlatCompat shim here — running it through
// FlatCompat throws "Converting circular structure to JSON" on the react plugin.
const config = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      '.app-build/**',
      'android/**',
      'ios/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Secrets/PII hygiene: console.log leaks order and user data into the
      // browser console and into native logcat / Console.app on the packaged
      // app, where anyone with the device can read it. lib/logger.ts is the
      // sanctioned path.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // The app build is a static export (Capacitor bundles the HTML/JS on the
      // device), where next/image's optimizer never runs — a plain <img> is the
      // correct primitive there, so this is advisory rather than a gate.
      '@next/next/no-img-element': 'warn',
      'react/no-unescaped-entities': 'warn',
      // React 19's cascading-render advisory. Eleven existing effects trip it.
      // Restructuring them changes render timing on the order and payment
      // screens, so it is tracked as debt in RULES.md rather than bundled into
      // an unrelated change — but it must not grow, so it stays visible.
      'react-hooks/set-state-in-effect': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // One-off maintenance scripts run on a laptop, not in the app bundle, so
    // console output is the point and CommonJS requires are fine.
    files: ['scripts/**', 'load-test-read.mjs', '*.config.*', '**/*.config.mjs'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // The single sanctioned console.log wrapper. Everything else must go
    // through it, which is what the no-console rule above enforces.
    files: ['lib/logger.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: { 'no-console': 'off', '@typescript-eslint/no-explicit-any': 'off' },
  },
]

export default config
