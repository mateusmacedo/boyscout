/**
 * Exemplo 3: Logger com Redação de Dados Sensíveis
 * Demonstra como configurar redação automática de dados sensíveis
 */

import { createLogger, createRedactor } from '../src/index';

// Logger com redação de dados sensíveis
const secureLogger = createLogger({
  level: 'info',
  service: 'secure-service',
  redact: createRedactor({
    keys: ['password', 'token', 'secret', 'apiKey', 'authorization'],
    patterns: [
      /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi, // CPF
      /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/gi, // CNPJ
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, // Email
    ],
    keepLengths: false,
  }),
});

// Dados sensíveis serão automaticamente redatados
secureLogger.info('User authentication', {
  userId: '123',
  password: 'secret123', // Será redatado para [REDACTED]
  token: 'abc123def456', // Será redatado para [REDACTED]
  cpf: '123.456.789-00', // Será redatado para [REDACTED]
  email: 'user@example.com', // Será redatado para [REDACTED]
  apiKey: 'sk-1234567890abcdef', // Será redatado para [REDACTED]
});

// Exemplo com dados de usuário
const userData = {
  id: '123',
  name: 'João Silva',
  email: 'joao.silva@example.com',
  password: 'minhasenha123',
  cpf: '123.456.789-00',
  phone: '11999999999',
};

secureLogger.info('User registration', userData);

// Exemplo com token de API
const apiRequest = {
  endpoint: '/api/data',
  headers: {
    authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'x-api-key': 'sk-1234567890abcdef',
  },
  body: {
    userId: '123',
    secret: 'confidential-data',
  },
};

secureLogger.info('API request', apiRequest);
