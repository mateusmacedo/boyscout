/**
 * Configuração base do Jest para todos os projetos
 * Define configurações globais de coverage e estrutura hierárquica
 */

/**
 * Determina o diretório de coverage baseado no tipo e nome do projeto
 * @param {string} projectRoot - Caminho raiz do projeto
 * @param {string} projectName - Nome do projeto
 * @returns {string} - Caminho do diretório de coverage
 */
function getCoverageDirectory(projectRoot, projectName) {
  // Determina se é lib ou app baseado no caminho
  const isLib = projectRoot.includes('/libs/');
  const isApp = projectRoot.includes('/apps/');

  if (isLib) {
    return `../../coverage/libs/${projectName}`;
  } else if (isApp) {
    return `../../coverage/apps/${projectName}`;
  } else {
    // Fallback para projetos na raiz
    return `../../coverage/${projectName}`;
  }
}

/**
 * Cria configuração base do Jest
 * @param {string} projectRoot - Caminho raiz do projeto
 * @param {string} projectName - Nome do projeto
 * @param {object} customConfig - Configurações customizadas
 * @returns {object} - Configuração do Jest
 */
function createJestConfig(projectRoot, projectName, customConfig = {}) {
  const coverageDirectory = getCoverageDirectory(projectRoot, projectName);

  return {
    // Configurações de coverage globais
    coverageDirectory,
    collectCoverageFrom: [
      'src/**/*.{ts,tsx,js,jsx}',
      '!src/**/*.d.ts',
      '!src/**/*.spec.{ts,tsx,js,jsx}',
      '!src/**/*.test.{ts,tsx,js,jsx}',
      '!src/**/__tests__/**',
      '!src/**/tests/**',
      '!src/**/index.ts',
      '!src/**/index.js',
      '!**/index.{ts,js}',
      '!**/*.config.{js,ts}',
      '!**/jest.config.{js,ts}',
      '!**/jest.preset.{js,ts}',
      '!**/jest.setup.{js,ts}',
    ],
    // Coverage reporters para múltiplos formatos
    coverageReporters: ['text', 'lcov', 'html'],
    // Coverage thresholds mais rigorosos
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    // Configurações de teste globais
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js,jsx}',
      '<rootDir>/src/**/*.{spec,test}.{ts,tsx,js,jsx}',
      '<rootDir>/tests/**/*.{spec,test}.{ts,tsx,js,jsx}',
    ],
    // Configurações de performance
    maxWorkers: '50%',
    // Cache configurations
    cacheDirectory: '<rootDir>/.jest-cache',
    // Jest best practices
    clearMocks: true,
    restoreMocks: true,
    // Transform ignore patterns para ESM modules
    transformIgnorePatterns: ['node_modules/(?!(pino|@elastic/ecs-pino-format)/)'],
    // Setup files globais
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    // Merge com configurações customizadas
    ...customConfig,
  };
}

module.exports = {
  createJestConfig,
  getCoverageDirectory,
};
