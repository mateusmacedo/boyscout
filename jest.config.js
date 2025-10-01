const { getJestProjectsAsync } = require('@nx/jest');

module.exports = async () => ({
  projects: await getJestProjectsAsync(),
  // Global configurations for all projects
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/index.{ts,js}',
    '!**/__tests__/**',
    '!**/tests/**',
    '!**/test/**',
    '!**/*.spec.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    // Ignorar arquivos de configuração
    '!**/*.config.{js,ts}',
    '!**/*.setup.{js,ts}',
    '!**/jest.config.*',
    '!**/jest.setup.*',
    '!**/jest.preset.*',
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
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Performance configurations
  maxWorkers: '50%',
  // Environment configurations
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // TypeScript configuration for Jest
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/jest.tsconfig.json',
        useESM: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // Transform ignore patterns for ESM modules
  transformIgnorePatterns: ['node_modules/(?!(pino|@elastic/ecs-pino-format)/)'],
});
