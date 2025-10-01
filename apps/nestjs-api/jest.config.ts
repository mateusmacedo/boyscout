export default {
  displayName: 'nestjs-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/nestjs-api',
  // Clear any global mocks that might interfere with NestJS
  clearMocks: true,
  restoreMocks: true,
  // Coverage configuration
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/tests/**',
    '!src/**/test/**',
    // Ignorar arquivos de configuração e setup
    '!src/**/*.config.ts',
    '!src/**/*.setup.ts',
    '!src/**/jest.config.*',
    '!src/**/jest.setup.*',
    '!src/**/vite.config.*',
    '!src/**/webpack.config.*',
    '!src/**/eslint.config.*',
    '!src/**/prettier.config.*',
    '!src/**/tailwind.config.*',
    '!src/**/postcss.config.*',
    '!src/**/babel.config.*',
    '!src/**/tsconfig.*',
    // Ignorar arquivos de ambiente
    '!src/**/.env*',
    '!src/**/environment.*',
    '!src/**/env.*',
    // Ignorar arquivos de documentação
    '!src/**/*.md',
    '!src/**/README*',
    '!src/**/CHANGELOG*',
    '!src/**/LICENSE*',
    // Ignorar arquivos de tipos
    '!src/**/*.d.ts',
    '!src/**/types/**',
    '!src/**/typings/**',
    // Ignorar arquivos de migração
    '!src/**/migrations/**',
    '!src/**/seeds/**',
    '!src/**/fixtures/**',
    // Ignorar arquivos de exemplo
    '!src/**/examples/**',
    '!src/**/demos/**',
    '!src/**/samples/**',
    // Ignorar utilitários de teste
    '!src/**/test-utils/**',
    '!src/**/test-helpers/**',
    '!src/**/testing/**',
    '!src/**/__mocks__/**',
    '!src/**/mocks/**',
    // Ignorar arquivos específicos do NestJS
    '!src/main.ts',
    '!src/app/app.module.ts',
    '!src/app/app.controller.ts', // Se for apenas um controller básico
  ],
  coverageThreshold: {
    'src/app/**/*.ts': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Test patterns
  testMatch: ['<rootDir>/src/**/*.spec.ts', '<rootDir>/src/**/*.test.ts'],
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  // Module name mapping for better coverage
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
