/**
 * Mutation testing config (stryker.config.json). Stryker's Jest runner ignores
 * `projects`, so this flattens the unit and E2E suites into one project.
 */
const base = require('./jest.config.base');
const e2e = require('./jest.config.e2e');
const unit = require('./jest.config.unit');

module.exports = {
  ...base,
  roots: [...unit.roots, ...e2e.roots],
  testMatch: ['**/*.test.@(ts|tsx)'],
  setupFilesAfterEnv: e2e.setupFilesAfterEnv,
  testTimeout: e2e.testTimeout,
};
