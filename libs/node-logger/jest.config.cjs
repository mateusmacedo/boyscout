const { createJestConfig } = require('../../jest.config.base');

module.exports = createJestConfig(
  __dirname, // projectRoot
  'node-logger', // projectName
  {
    // Configurações específicas do projeto
    displayName: '@boyscout/node-logger',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
      '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@tests/(.*)$': '<rootDir>/tests/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    transformIgnorePatterns: ['node_modules/(?!(pino|@elastic/ecs-pino-format)/)'],
    // Reporters são configurados via Nx, não diretamente no Jest
  }
);
