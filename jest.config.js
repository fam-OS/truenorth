/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/test/ui/',
    '<rootDir>/test/e2e/',
    '<rootDir>/playwright-report/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^server-only$': '<rootDir>/test/mocks/server-only.js',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};