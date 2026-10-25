import { defineConfig } from 'eslint/config';
import globals from 'globals';
import obsidianmd from 'eslint-plugin-obsidianmd';
import { restrictedGlobalsOptions } from 'eslint-plugin-obsidianmd/dist/lib/ruleOptions.js';

const layer = (patterns) => [
  'error',
  { patterns: [{ group: patterns, message: 'Breaks the layer rules in docs/developer/architecture.md.' }] }
];

export default defineConfig([
  { ignores: ['main.js', 'node_modules/**', 'coverage/**'] },
  ...obsidianmd.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.mjs',
            'esbuild.config.mjs',
            'version-bump.mjs',
            'scripts/*.mjs'
          ]
        },
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'Use createEl/setText instead.' },
        { property: 'outerHTML', message: 'Use createEl/setText instead.' },
        { property: 'insertAdjacentHTML', message: 'Use createEl/setText instead.' }
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "CallExpression[callee.name='eval']", message: 'No dynamic code.' },
        { selector: "NewExpression[callee.name='Function']", message: 'No dynamic code.' }
      ]
    }
  },
  {
    // Tests and build scripts run in Node, not in Obsidian.
    files: ['tests/**/*.ts', 'vitest.config.ts', '*.mjs', 'scripts/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
      // moment arrives through the obsidian package; the scanner bans declaring it (depend/ban-dependencies).
      'import/no-extraneous-dependencies': 'off',
      'obsidianmd/no-nodejs-modules': 'off',
      'obsidianmd/no-global-this': 'off'
    }
  },
  {
    files: ['src/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'error' }
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': layer([
        'obsidian',
        '**/services/**',
        '**/features/**',
        '**/ui/**',
        '**/strings',
        '**/main'
      ]),
      'no-restricted-globals': [
        'warn',
        ...restrictedGlobalsOptions,
        { name: 'document', message: 'core/ is pure: no DOM.' },
        { name: 'window', message: 'core/ is pure: no DOM.' },
        { name: 'activeDocument', message: 'core/ is pure: no DOM.' },
        { name: 'activeWindow', message: 'core/ is pure: no DOM.' }
      ]
    }
  },
  {
    files: ['src/services/**/*.ts'],
    rules: { 'no-restricted-imports': layer(['**/features/**', '**/ui/**', '**/main']) }
  },
  {
    files: ['src/ui/**/*.ts'],
    rules: { 'no-restricted-imports': layer(['**/obsidian-internals', '**/features/**', '**/main']) }
  },
  {
    files: ['src/features/**/*.ts'],
    rules: { 'no-restricted-imports': layer(['**/main']) }
  }
]);
