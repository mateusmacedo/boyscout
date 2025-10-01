const nxPreset = require('@nx/jest/preset').default;
const { createJestConfig } = require('./jest.config.base');

/** @type {import('jest').Config} */
const jestConfig = {
  ...nxPreset,
  // Additional preset configurations
  testEnvironment: 'node',
  // Global coverage configuration for hierarchical structure
  // coverageReporters: ['text', 'lcov', 'html', 'json'], // Removido para evitar warnings
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
    '!**/index.{ts,js}',
    '!**/*.spec.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/__tests__/**',
    '!**/tests/**',
    '!**/test/**',
    // Ignorar arquivos de configuração
    '!**/*.config.{js,ts,cjs,mjs}',
    '!**/*.setup.{js,ts,cjs,mjs}',
    '!**/jest.config.*',
    '!**/jest.setup.*',
    '!**/jest.preset.*',
    '!**/jest.base.*',
    '!**/vite.config.*',
    '!**/webpack.config.*',
    '!**/rollup.config.*',
    '!**/eslint.config.*',
    '!**/prettier.config.*',
    '!**/tailwind.config.*',
    '!**/postcss.config.*',
    '!**/babel.config.*',
    '!**/tsconfig.*',
    '!**/nx.json',
    '!**/package.json',
    // Ignorar arquivos de ambiente
    '!**/.env*',
    '!**/environment.*',
    '!**/env.*',
    // Ignorar arquivos de build
    '!**/build/**',
    '!**/out/**',
    // Ignorar arquivos de documentação
    '!**/*.md',
    '!**/README*',
    '!**/CHANGELOG*',
    '!**/LICENSE*',
    // Ignorar arquivos de tipos
    '!**/types/**',
    '!**/typings/**',
    // Ignorar arquivos de migração
    '!**/migrations/**',
    '!**/seeds/**',
    '!**/fixtures/**',
    // Ignorar arquivos de exemplo
    '!**/examples/**',
    '!**/demos/**',
    '!**/samples/**',
    // Ignorar utilitários de teste
    '!**/test-utils/**',
    '!**/test-helpers/**',
    '!**/testing/**',
    '!**/__mocks__/**',
    '!**/mocks/**',
  ],
  // Performance configurations
  maxWorkers: '50%',
  // Cache configurations
  cacheDirectory: '<rootDir>/.jest-cache',
  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: ['node_modules/(?!(pino|@elastic/ecs-pino-format)/)'],
};

module.exports = jestConfig;

// Export helper function for project-specific configs
module.exports.createJestConfig = createJestConfig;
