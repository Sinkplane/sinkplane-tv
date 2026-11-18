const PRODUCTION = '^(app|layouts|components|hooks|constants|types)/';
const TEST = '(^__tests__/|\\.test\\.tsx?$)';
const PLATFORM_VARIANT = '\\.(web|ios|android|native|tv|ios\\.tv|android\\.tv)\\.tsx?$';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Cycles make modules impossible to understand or change in isolation.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'error',
      comment: 'Nothing imports this file. Delete it or wire it in.',
      from: {
        orphan: true,
        pathNot: ['^app/', TEST, PLATFORM_VARIANT, '\\.d\\.ts$', '^[^/]+$'],
      },
      to: {},
    },
    {
      name: 'routes-are-entry-points',
      severity: 'error',
      comment:
        'Expo Router is the only entry into app/. Move shared pieces into components or hooks.',
      from: { path: '^(?!app/)', pathNot: TEST },
      to: { path: '^app/' },
    },
    {
      name: 'layouts-below-routes',
      severity: 'error',
      comment: 'layouts compose components and hooks; they never import routes.',
      from: { path: '^layouts/' },
      to: { path: '^app/' },
    },
    {
      name: 'components-below-layouts',
      severity: 'error',
      comment: 'components render; they do not know about screen layouts or routes.',
      from: { path: '^components/' },
      to: { path: '^(app|layouts)/' },
    },
    {
      name: 'hooks-below-components',
      severity: 'error',
      comment: 'hooks hold state and behavior. Pass rendering in from components instead.',
      from: { path: '^hooks/' },
      to: { path: '^(app|layouts|components)/' },
    },
    {
      name: 'constants-are-leaves',
      severity: 'error',
      comment:
        'constants and types hold values, pure helpers, and typings; they import no other layer.',
      from: { path: '^(constants|types)/' },
      to: { path: '^(app|layouts|components|hooks)/' },
    },
    {
      name: 'not-to-test',
      severity: 'error',
      comment: 'Production code must not import tests or test helpers.',
      from: { path: PRODUCTION, pathNot: TEST },
      to: { path: TEST },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment: 'Production code must not depend on devDependencies.',
      from: { path: PRODUCTION, pathNot: TEST },
      to: { dependencyTypes: ['npm-dev'], dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'no-node-builtins-in-the-app',
      severity: 'error',
      comment:
        'The app ships to tvOS and Android TV through Metro. Node built-ins do not exist there.',
      from: { path: PRODUCTION, pathNot: TEST },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'This import does not resolve. Fix the path or add the package.',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^(node_modules|ios|android|dist|coverage|reports|\\.expo)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types', 'react-native'],
      mainFields: ['react-native', 'module', 'main', 'types', 'typings'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.d.ts', '.json'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
