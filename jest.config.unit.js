module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.@(ts|tsx|js|jsx)'],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/', '\\.e2e\\.test\\.'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@sinkplane/shared$': '<rootDir>/../sinkplane-shared/index.ts',
    '^@sinkplane/shared/(.*)$': '<rootDir>/../sinkplane-shared/$1',
  },
  clearMocks: true,
  modulePaths: ['<rootDir>/node_modules'],
  testTimeout: 30000,
};
