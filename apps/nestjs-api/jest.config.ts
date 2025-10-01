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
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/tests/**',
    '!src/**/test/**',
    // Ignorar arquivos E2E
    '!e2e/**',
    '!**/e2e/**',
    // Ignorar arquivos de configuração e setup
    '!src/**/*.config.{ts,js,cjs,mjs}',
    '!src/**/*.setup.{ts,js,cjs,mjs}',
    '!src/**/jest.config.*',
    '!src/**/jest.setup.*',
    '!src/**/jest.preset.*',
    '!src/**/jest.base.*',
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
    // Ignorar arquivos específicos do NestJS (bootstrap e módulos)
    '!src/main.ts', // Bootstrap da aplicação (não testável unitariamente)
    '!src/**/*.module.ts', // Módulos NestJS (apenas configuração/metadados)
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
