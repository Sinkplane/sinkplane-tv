/**
 * Jest configuration for the Sinkplane TV end-to-end integration suite.
 *
 * The suite boots the real Expo Router app (app/**) via
 * `expo-router/testing-library` inside Jest, with:
 *  - a stateful in-memory Floatplane API replacing global.fetch
 *  - native-only modules (video, TCP server, secure store, ...) replaced by
 *    controllable mocks (see __tests__/e2e/helpers/native-mocks.ts)
 *
 * This exercises the full JS stack — navigation, providers, hooks, screens —
 * the way a device E2E run would, without needing a simulator.
 */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/__tests__/e2e'],
  testMatch: ['**/*.e2e.test.@(ts|tsx|js|jsx)'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/e2e/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Shared package installs from GitHub Packages; Jest maps it to the
    // sibling clone's TS sources (present in a full dev setup) so it is
    // transformed by babel-jest like project files.
    '^@sinkplane/shared$': '<rootDir>/../sinkplane-shared/index.ts',
    '^@sinkplane/shared/(.*)$': '<rootDir>/../sinkplane-shared/$1',
  },
  clearMocks: true,
  // Shared package files live in the sibling repo (outside this project's
  // node_modules walk-up), so their bare imports (react, @babel/runtime, …)
  // must fall back to this project's node_modules to keep a single instance
  // of each module in the registry — see moduleNameMapper above.
  modulePaths: ['<rootDir>/node_modules'],
  testTimeout: 30000,
  // Coverage: enforce a 90% floor over TV app sources. Jest exits non-zero
  // when any metric falls below the threshold.
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'layouts/**/*.{ts,tsx}',
    'constants/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'lcov', 'text', 'text-summary'],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
  // In CI, also emit GitHub Actions annotations for failing tests
  // (built-in reporter since Jest 30; no-op elsewhere).
  reporters: process.env.CI ? ['default', 'github-actions'] : ['default'],
};
