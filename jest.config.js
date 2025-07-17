/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test discovery
  testMatch: [
    '<rootDir>/src/**/*.test.ts'
  ],

  // Ignore these directories
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.d.ts'
  ],

  // Module paths
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};