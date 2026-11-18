/**
 * Unit tests: colocated `*.test.ts(x)` files exercising components, hooks and
 * pure helpers in isolation. Route modules (app/**) are driven by the E2E suite.
 */
const base = require('./jest.config.base');

module.exports = {
  ...base,
  displayName: 'unit',
  roots: ['<rootDir>/components', '<rootDir>/hooks', '<rootDir>/layouts', '<rootDir>/constants'],
  testMatch: ['**/*.test.@(ts|tsx)'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'layouts/**/*.{ts,tsx}',
    'constants/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!app/+html.tsx',
    '!**/*.test.{ts,tsx}',
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
};
