# 📘 Guia de Boas Práticas para Testes E2E

Este guia fornece diretrizes e convenções para escrever testes E2E de alta qualidade, garantindo confiabilidade, manutenibilidade e desempenho.

## 🎯 Princípios Fundamentais

### 1. Isolamento de Testes

**✅ BOM:**
```typescript
test.describe('User Operations', () => {
  const createdUserIds: string[] = [];

  test.afterEach(async ({ request }) => {
    // Cleanup automático após cada teste
    await userHelpers.deleteBatch(request, createdUserIds);
    createdUserIds.length = 0;
  });

  test('should create user', async ({ request }) => {
    const user = await userHelpers.create(request, userDataFactory.create());
    createdUserIds.push(user.id);
    // ... asserts
  });
});
```

**❌ RUIM:**
```typescript
test.describe('User Operations', () => {
  let userId: string; // Estado compartilhado entre testes

  test('should create user', async ({ request }) => {
    userId = await createUser(); // Outros testes dependem disto
  });

  test('should get user', async ({ request }) => {
    await getUser(userId); // Depende do teste anterior
  });
});
```

### 2. Dados Únicos e Previsíveis

**✅ BOM:**
```typescript
test('should create user', async ({ request }) => {
  // Gera dados únicos para evitar conflitos
  const userData = userDataFactory.create();
  const user = await userHelpers.create(request, userData);
  // ...
});
```

**❌ RUIM:**
```typescript
test('should create user', async ({ request }) => {
  // Email hardcoded causa conflitos em testes paralelos
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: '123456',
  };
  // ...
});
```

### 3. Padrão AAA (Arrange-Act-Assert)

**✅ BOM:**
```typescript
test('should update user name', async ({ request }) => {
  // Arrange: Prepara o estado inicial
  const userData = userDataFactory.create();
  const user = await userHelpers.create(request, userData);
  createdUserIds.push(user.id);

  // Act: Executa a ação a ser testada
  const response = await request.put(`/api/users/${user.id}`, {
    data: { name: 'Updated Name' },
  });

  // Assert: Verifica o resultado
  expect(response.status()).toBe(200);
  const updatedUser = await response.json();
  expect(updatedUser.name).toBe('Updated Name');
});
```

**❌ RUIM:**
```typescript
test('should update user name', async ({ request }) => {
  const user = await userHelpers.create(request, userDataFactory.create());
  expect((await request.put(`/api/users/${user.id}`, {
    data: { name: 'Updated' },
  })).status()).toBe(200); // Tudo misturado
});
```

## 📂 Estrutura de Arquivos

```
e2e/
├── fixtures/
│   └── test-data.ts           # Factories de dados
├── helpers/
│   └── test-helpers.ts        # Funções utilitárias
├── user-endpoints.spec.ts     # Testes de endpoints
├── analytics-endpoints.spec.ts
├── BEST_PRACTICES.md          # Este guia
└── README.md                  # Documentação geral
```

## 🏭 Uso de Fixtures e Factories

### Factories de Dados

Use factories para gerar dados consistentes e únicos:

```typescript
// fixtures/test-data.ts
export const userDataFactory = {
  create: (overrides = {}) => ({
    name: `User ${uniqueId()}`,
    email: uniqueEmail('user'),
    password: 'senha123456',
    ...overrides,
  }),

  createBatch: (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      name: `User ${i}-${uniqueId()}`,
      email: uniqueEmail(`user${i}`),
      password: 'senha123456',
    }));
  },
};
```

### Uso das Factories

```typescript
test('should create user', async ({ request }) => {
  // Dados padrão
  const user1 = userDataFactory.create();

  // Dados customizados
  const user2 = userDataFactory.create({
    name: 'Custom Name',
  });

  // Múltiplos usuários
  const users = userDataFactory.createBatch(5);
});
```

## 🛠️ Uso de Helpers

### Helpers de Operações

Encapsule operações comuns em helpers reutilizáveis:

```typescript
// helpers/test-helpers.ts
export const userHelpers = {
  async create(request, userData) {
    const response = await request.post('/api/users', { data: userData });
    expect(response.status()).toBe(201);
    return response.json();
  },

  async deleteBatch(request, userIds) {
    for (const id of userIds) {
      await request.delete(`/api/users/${id}`);
    }
  },
};
```

### Uso dos Helpers

```typescript
test('should create and delete user', async ({ request }) => {
  // Cria usuário com helper
  const user = await userHelpers.create(request, userDataFactory.create());

  // ... testes

  // Cleanup com helper
  await userHelpers.delete(request, user.id);
});
```

## 🧹 Cleanup e Hooks

### afterEach para Cleanup

Sempre use `afterEach` para garantir cleanup, mesmo em caso de falha:

```typescript
test.describe('User Tests', () => {
  const createdUserIds: string[] = [];

  test.afterEach(async ({ request }) => {
    if (createdUserIds.length > 0) {
      await userHelpers.deleteBatch(request, createdUserIds);
      createdUserIds.length = 0;
    }
  });

  test('test 1', async ({ request }) => {
    const user = await userHelpers.create(request, userDataFactory.create());
    createdUserIds.push(user.id); // Registra para cleanup
    // ...
  });
});
```

### beforeEach para Setup Comum

Use `beforeEach` quando múltiplos testes precisam do mesmo setup:

```typescript
test.describe('User Stats Tests', () => {
  const createdUserIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    // Cria usuários de teste
    const users = await userHelpers.createBatch(
      request,
      userDataFactory.createBatch(5)
    );
    createdUserIds.push(...users.map(u => u.id));
  });

  test.afterEach(async ({ request }) => {
    await userHelpers.deleteBatch(request, createdUserIds);
    createdUserIds.length = 0;
  });

  test('should calculate total users', async ({ request }) => {
    const stats = await request.get('/api/users/stats');
    // ...
  });
});
```

## 📝 Nomenclatura e Documentação

### Nomenclatura de Testes

**Formato:** `[METHOD] [endpoint] - should [behavior]`

```typescript
test('POST /api/users - should create a new user', ...);
test('GET /api/users/:id - should return 404 for non-existent user', ...);
test('PUT /api/users/:id - should update user name', ...);
```

### Organização de Describes

```typescript
test.describe('User Endpoints - CRUD Operations', () => {
  // Testes de Create, Read, Update, Delete
});

test.describe('User Endpoints - Search and Statistics', () => {
  // Testes de busca e estatísticas
});

test.describe('User Endpoints - Security Tests', () => {
  // Testes de segurança
});

test.describe('User Endpoints - Performance Tests', () => {
  // Testes de performance
});
```

### Comentários JSDoc

```typescript
/**
 * User Endpoints E2E Tests
 * 
 * Testa operações CRUD, busca e estatísticas de usuários
 * com isolamento completo e cleanup automático.
 */
test.describe('User Endpoints', () => {
  // ...
});
```

## ✅ Assertions

### Use Helpers de Assertion

```typescript
// helpers/test-helpers.ts
export const assertionHelpers = {
  expectProperties(obj, properties) {
    for (const prop of properties) {
      expect(obj).toHaveProperty(prop);
    }
  },

  expectNoSensitiveData(obj, sensitiveFields = ['password', 'token']) {
    for (const field of sensitiveFields) {
      expect(obj).not.toHaveProperty(field);
    }
  },
};
```

### Uso

```typescript
test('should not expose sensitive data', async ({ request }) => {
  const user = await userHelpers.create(request, userDataFactory.create());

  // Assertions claras e reutilizáveis
  assertionHelpers.expectProperties(user, ['id', 'name', 'email']);
  assertionHelpers.expectNoSensitiveData(user);
});
```

## ⚡ Performance

### Medição de Performance

```typescript
test('should complete within time limit', async ({ request }) => {
  const result = await performanceHelpers.assertTimeLimit(
    async () => request.get('/api/users/stats'),
    testConstants.performance.maxResponseTime
  );

  expect(result.status()).toBe(200);
});
```

### Testes Concorrentes

```typescript
test('should handle concurrent requests', async ({ request }) => {
  const operations = Array.from({ length: 10 }, () => 
    () => request.get('/api/users')
  );

  const responses = await Promise.all(operations.map(op => op()));

  responses.forEach(response => {
    expect(response.status()).toBe(200);
  });
});
```

## 🔒 Segurança

### Testes de Dados Maliciosos

```typescript
test('should handle SQL injection safely', async ({ request }) => {
  const maliciousData = securityTestData.sqlInjection;
  
  const user = await userHelpers.create(request, maliciousData);
  
  // Verifica que foi tratado como string literal
  expect(user.name).toBe(maliciousData.name);
});
```

### Validação de Entrada

```typescript
test('should reject invalid input', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: { /* dados inválidos */ },
  });

  await assertionHelpers.expectErrorWithMessage(
    response,
    400,
    'Validation failed'
  );
});
```

## 📊 Constantes e Configuração

### Use Constantes

```typescript
// fixtures/test-data.ts
export const testConstants = {
  httpCodes: {
    ok: 200,
    created: 201,
    badRequest: 400,
    notFound: 404,
  },
  
  performance: {
    maxResponseTime: 1000,
    maxConcurrentRequests: 100,
  },
};
```

### Uso

```typescript
test('should return 200', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.status()).toBe(testConstants.httpCodes.ok);
});
```

## 🚫 Anti-Padrões a Evitar

### ❌ Testes Dependentes

```typescript
// RUIM: Testes dependem uns dos outros
let userId;

test('create user', async () => {
  userId = await createUser(); // Próximo teste depende disto
});

test('get user', async () => {
  await getUser(userId); // Falha se teste anterior falhar
});
```

### ❌ Dados Hardcoded

```typescript
// RUIM: Email fixo causa conflitos
const userData = {
  email: 'test@example.com', // Sempre o mesmo
};
```

### ❌ Falta de Cleanup

```typescript
// RUIM: Recursos criados não são limpos
test('create user', async () => {
  await createUser(); // Fica no sistema para sempre
});
```

### ❌ Assertions Confusas

```typescript
// RUIM: Assertion complexa e difícil de entender
expect((await (await request.post('/api/users', { data })).json()).id).toBeDefined();
```

## ✨ Checklist de Revisão

Antes de submeter testes, verifique:

- [ ] Testes são independentes e podem rodar em qualquer ordem
- [ ] Dados são gerados de forma única (sem hardcode)
- [ ] Cleanup é feito no `afterEach`
- [ ] Padrão AAA (Arrange-Act-Assert) é seguido
- [ ] Nomenclatura é clara e descritiva
- [ ] Helpers e fixtures são usados onde apropriado
- [ ] Assertions são claras e específicas
- [ ] Dados sensíveis são validados (não expostos)
- [ ] Performance é considerada em testes de carga
- [ ] Documentação JSDoc está presente

## 📚 Recursos Adicionais

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [AAA Pattern](https://medium.com/@pjbgf/title-testing-code-ocd-and-the-aaa-pattern-df453975ab80)

## 🔄 Evolução Contínua

Este guia é vivo e deve ser atualizado conforme novas práticas emergem. Contribua com melhorias através de PRs!


