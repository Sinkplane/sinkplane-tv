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
const base = require('./jest.config.base');

module.exports = {
  ...base,
  displayName: 'e2e',
  roots: ['<rootDir>/__tests__/e2e'],
  testMatch: ['**/*.e2e.test.@(ts|tsx)'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/e2e/jest.setup.ts'],
  testTimeout: 120000,
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'layouts/**/*.{ts,tsx}',
    'constants/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!app/+html.tsx',
    '!**/*.test.{ts,tsx}',
  ],
  coverageDirectory: '<rootDir>/coverage/e2e',
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
};
