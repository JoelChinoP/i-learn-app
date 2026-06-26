module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    'coverage',
    'playwright-report',
    '.eslintrc.cjs',
    'src/_designSystem/**',
    'supabase/.temp/**',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      files: ['src/components/ui/**/*.tsx', 'src/lib/auth.tsx', 'src/lib/theme.tsx'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      files: ['supabase/functions/**/*.ts'],
      globals: { Deno: 'readonly' },
    },
  ],
}
