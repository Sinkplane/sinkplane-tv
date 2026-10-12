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
  },
  clearMocks: true,
  testTimeout: 30000,
};
