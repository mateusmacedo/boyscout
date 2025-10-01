const nxPreset = require('@nx/jest/preset').default;
const { createJestConfig } = require('./jest.config.base');

module.exports = {
  ...nxPreset,
  // Additional preset configurations
  testEnvironment: 'node',
  // Global coverage configuration for hierarchical structure
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // Default coverage configurations
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/jest.config.{js,ts}',
    '!**/jest.preset.{js,ts}',
    '!**/jest.setup.{js,ts}',
  ],
  // Performance configurations
  maxWorkers: '50%',
  // Cache configurations
  cacheDirectory: '<rootDir>/.jest-cache',
  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: ['node_modules/(?!(pino|@elastic/ecs-pino-format)/)'],
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Export helper function for project-specific configs
  createJestConfig,
};
