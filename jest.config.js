
module.exports = {
  testTimeout: 60e3,
  maxWorkers: 3,
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  transform: {
      '^.+\\.ts$': 'ts-jest',
  },
  modulePathIgnorePatterns: [
      'e2e',
      'dist/package.json',
      '<rootDir>/package.json',
  ]
};