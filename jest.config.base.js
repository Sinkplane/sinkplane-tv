/**
 * Settings shared by the unit (jest.config.unit.js) and E2E (jest.config.e2e.js) suites.
 */
const fs = require('node:fs');
const path = require('node:path');

// The sibling clone ../sinkplane-shared, found by walking up so the lookup also
// works from Stryker's sandbox (.stryker-tmp/sandbox-*/ inside this repo).
function findSharedClone(start) {
  for (let dir = start; dir !== path.dirname(dir); dir = path.dirname(dir)) {
    const candidate = path.join(path.dirname(dir), 'sinkplane-shared');
    if (fs.existsSync(path.join(candidate, 'index.ts'))) {
      return candidate;
    }
  }
  throw new Error(
    'sinkplane-shared clone not found next to this repo (run scripts/setup-dev-env.sh)',
  );
}

const sharedClone = findSharedClone(__dirname);

module.exports = {
  preset: 'jest-expo',
  rootDir: __dirname,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Shared package installs from GitHub Packages; Jest maps it to the
    // sibling clone's TS sources (present in a full dev setup) so it is
    // transformed by babel-jest like project files.
    '^@sinkplane/shared$': path.join(sharedClone, 'index.ts'),
    '^@sinkplane/shared/(.*)$': path.join(sharedClone, '$1'),
  },
  // Shared package files live in the sibling repo (outside this project's
  // node_modules walk-up), so their bare imports (react, @babel/runtime, …)
  // must fall back to this project's node_modules to keep a single instance
  // of each module in the registry — see moduleNameMapper above.
  modulePaths: ['<rootDir>/node_modules'],
  clearMocks: true,
  testTimeout: 30000,
  // `json` (coverage-final.json) feeds scripts/crap.mts.
  coverageReporters: ['text-summary', 'json', 'lcov', 'html'],
  // GitHub Actions annotations for failing tests in CI (built into Jest 30).
  reporters: process.env.CI ? ['default', 'github-actions'] : ['default'],
};
