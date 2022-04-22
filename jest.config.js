
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
      'dist/package.json',
      '<rootDir>/package.json',
  ]
};