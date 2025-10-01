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
};
