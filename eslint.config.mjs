import eslint from '@eslint/js';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslintReact from '@eslint-react/eslint-plugin';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import { importX } from 'eslint-plugin-import-x';
import jest from 'eslint-plugin-jest';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { localRules } from './eslint.local-rules.mjs';

const APP_FILES = ['{app,components,hooks,layouts,constants,types}/**/*.{ts,tsx}'];
const TEST_FILES = ['__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'];
const TOOLING_FILES = ['*.{js,mjs,cjs}', 'plugins/**/*.js', 'scripts/**/*.{js,mjs,cjs}'];

const GATED_RULES = [
  'complexity',
  'max-depth',
  'max-lines',
  'max-lines-per-function',
  'max-nested-callbacks',
  'no-restricted-imports',
  'local/no-comments',
  '@typescript-eslint/max-params',
  '@typescript-eslint/consistent-type-assertions',
  'sonarjs/cognitive-complexity',
];

const NO_EFFECTS =
  'Effects are banned. Derive values during render, run side effects in the event handler that causes them, ' +
  'subscribe to external stores with useSyncExternalStore, reset state with a `key`, read async data with react-query, ' +
  'and use useFocusEffect for screen focus. See "No effects" in AGENTS.md.';

const RESTRICTED_REACT_IMPORTS = [
  {
    importNames: ['useEffect', 'useLayoutEffect', 'useInsertionEffect', 'useEffectEvent'],
    message: NO_EFFECTS,
  },
  {
    importNames: ['useMemo', 'useCallback', 'memo'],
    message: 'React Compiler memoizes components and hooks. Delete the manual memoization.',
  },
  { importNames: ['forwardRef'], message: 'React 19 passes `ref` as a regular prop.' },
  { importNames: ['useContext'], message: 'Use `use(Context)`.' },
  {
    importNames: ['Component', 'PureComponent', 'createElement', 'cloneElement', 'Children'],
    message: 'Write function components with JSX.',
  },
  {
    importNames: ['default'],
    message: 'Import what you use by name. The JSX transform needs no React import.',
  },
].map((rule) => ({ name: 'react', ...rule }));

const asErrors = (rules) =>
  Object.fromEntries(
    Object.entries(rules).map(([name, level]) => [name, level === 'warn' ? 'error' : level]),
  );

export default defineConfig(
  globalIgnores([
    'node_modules/',
    'dist/',
    'coverage/',
    'reports/',
    '.stryker-tmp/',
    '.expo/',
    'ios/',
    'android/',
    'web-build/',
    '.cursor/',
    '.claude/',
    'expo-env.d.ts',
  ]),

  {
    linterOptions: { reportUnusedDisableDirectives: 'error', reportUnusedInlineConfigs: 'error' },
  },

  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  comments.recommended,
  sonarjs.configs.recommended,

  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: globals.node,
    },
    plugins: { 'import-x': importX, local: localRules },
    rules: {
      complexity: ['error', 6],
      'max-depth': ['error', 3],
      'max-params': 'off',
      '@typescript-eslint/max-params': ['error', { max: 3 }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-nested-callbacks': ['error', 3],
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-nested-ternary': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-warning-comments': [
        'error',
        {
          terms: ['istanbul ignore', 'v8 ignore', 'c8 ignore', 'stryker disable'],
          location: 'anywhere',
        },
      ],
      'local/no-comments': 'error',
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1],
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true, requireDefaultForNonUnion: true },
      ],
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'objectLiteralProperty', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase'] },
        {
          selector: ['objectLiteralProperty', 'typeProperty'],
          modifiers: ['requiresQuotes'],
          format: null,
        },
      ],
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
      '@eslint-community/eslint-comments/no-restricted-disable': ['error', ...GATED_RULES],
      'import-x/no-default-export': 'error',
      'import-x/no-duplicates': 'error',
      'no-restricted-imports': ['error', { paths: RESTRICTED_REACT_IMPORTS }],
    },
  },

  {
    files: [...APP_FILES, ...TEST_FILES],
    extends: [
      eslintReact.configs['strict-type-checked'],
      eslintReact.configs['disable-conflict-eslint-plugin-react-hooks'],
      reactHooks.configs.flat['recommended-latest'],
    ],
    languageOptions: { globals: { ...globals.browser, __DEV__: 'readonly' } },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      ...asErrors(eslintReact.configs['strict-type-checked'].rules),
      ...asErrors(reactHooks.configs.flat['recommended-latest'].rules),
      '@eslint-react/no-unused-props': 'error',
      'react-refresh/only-export-components': 'error',
    },
  },

  {
    files: ['app/**/*.tsx'],
    rules: {
      'import-x/no-default-export': 'off',
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['unstable_settings', 'ErrorBoundary', 'generateStaticParams'] },
      ],
    },
  },

  {
    files: ['**/*.d.ts'],
    rules: { 'import-x/no-default-export': 'off' },
  },

  {
    files: TEST_FILES,
    extends: [jest.configs['flat/recommended'], testingLibrary.configs['flat/react']],
    rules: {
      ...asErrors(jest.configs['flat/recommended'].rules),
      ...asErrors(testingLibrary.configs['flat/react'].rules),
      '@typescript-eslint/no-magic-numbers': 'off',
      'max-lines-per-function': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },

  {
    files: TOOLING_FILES,
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      'import-x/no-default-export': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'local/no-comments': 'off',
    },
  },

  {
    files: ['*.{js,cjs}', 'plugins/**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },

  prettier,
);
