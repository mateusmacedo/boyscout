// Configuração global para testes
// Este arquivo é executado antes de cada teste

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';

// Mock global para evitar logs durante os testes
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));
