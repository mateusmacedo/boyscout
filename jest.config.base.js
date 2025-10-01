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
      // Ignorar arquivos de configuração
      '!**/*.config.{ts,js,cjs,mjs}',
      '!**/*.setup.{ts,js,cjs,mjs}',
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
      // Ignorar arquivos de ambiente e variáveis
      '!**/.env*',
      '!**/environment.*',
      '!**/env.*',
      // Ignorar arquivos de build e distribuição
      '!**/dist/**',
      '!**/build/**',
      '!**/out/**',
      '!**/coverage/**',
      '!**/node_modules/**',
      // Ignorar arquivos de documentação
      '!**/*.md',
      '!**/README*',
      '!**/CHANGELOG*',
      '!**/LICENSE*',
      // Ignorar arquivos de tipos e declarações
      '!**/*.d.ts',
      '!**/types/**',
      '!**/typings/**',
      // Ignorar arquivos de migração e seed
      '!**/migrations/**',
      '!**/seeds/**',
      '!**/fixtures/**',
      // Ignorar arquivos de exemplo e demo
      '!**/examples/**',
      '!**/demos/**',
      '!**/samples/**',
      // Ignorar arquivos de utilitários e helpers de teste
      '!**/test-utils/**',
      '!**/test-helpers/**',
      '!**/testing/**',
      '!**/__mocks__/**',
      '!**/mocks/**',
    ],
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
    // Jest best practices
    clearMocks: true,
    restoreMocks: true,
    // Merge com configurações customizadas
    ...customConfig,
  };
}

module.exports = {
  createJestConfig,
  getCoverageDirectory,
};
