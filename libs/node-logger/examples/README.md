# Exemplos de Uso do Logger

Este diretório contém exemplos executáveis e singulares de como usar a biblioteca de logger.

## 📁 Estrutura dos Exemplos

### 01-basic-logger.ts
**Logger Básico**
- Criação e uso básico do logger
- Diferentes níveis de log (info, error, debug, warn)
- Uso em funções

### 02-correlation-logger.ts
**Logger com Correlação de Requisições**
- Rastreamento de requisições com correlation ID
- Logging de múltiplas requisições
- Contexto de correlação automático

### 03-secure-logger.ts
**Logger com Redação de Dados Sensíveis**
- Configuração de redação automática
- Proteção de senhas, tokens, CPF, email
- Padrões personalizados de redação

### 04-environment-loggers.ts
**Loggers Específicos por Ambiente**
- Logger para desenvolvimento (formato legível)
- Logger para produção (formato JSON)
- Logger para testes (apenas erros)

### 05-child-context-logger.ts
**Logger com Child Context**
- Contexto persistente com child loggers
- Contexto de usuário, requisição e módulo
- Loggers aninhados

### 06-middleware-logger.ts
**Logger em Middlewares**
- Middleware de logging de requisições
- Middleware de autenticação com logging
- Middleware de rate limiting
- Error handling com logging

### 07-service-logger.ts
**Logger em Services**
- UserService com logging completo
- EmailService com logging de envios
- DatabaseService com logging de queries
- Tratamento de erros e sucessos

### 08-decorator-logger.ts
**Logger com Decorator**
- Uso do decorator @Log
- Controllers com logging automático
- Services com decorator
- Tratamento de erros com decorator

### 09-implementation-loggers.ts
**Diferentes Implementações**
- Pino logger (produção)
- Console logger (desenvolvimento)
- Comparação de performance
- Configurações específicas por implementação

### 10-advanced-configuration.ts
**Configuração Avançada**
- Logger com configurações complexas
- Filtros personalizados
- Transportes múltiplos
- Métricas e monitoramento
- Sampling e buffering

### 11-nestjs-integration.ts
**Integração com NestJS**
- Módulo de logger para NestJS
- Interceptors de logging
- Guards com logging
- Exception filters
- Middleware de logging

## 🚀 Como Executar

Cada exemplo é executável independentemente:

```bash
# Executar exemplo básico
npx ts-node examples/01-basic-logger.ts

# Executar exemplo de correlação
npx ts-node examples/02-correlation-logger.ts

# Executar exemplo de segurança
npx ts-node examples/03-secure-logger.ts

# E assim por diante...
```

## 📋 Características dos Exemplos

- ✅ **Executáveis**: Cada exemplo pode ser executado independentemente
- ✅ **Singulares**: Foco em um aspecto específico do logger
- ✅ **Completos**: Código funcional sem placeholders
- ✅ **Comentados**: Explicações claras do que está acontecendo
- ✅ **Práticos**: Exemplos reais de uso em aplicações

## 🔧 Dependências

Os exemplos utilizam as seguintes dependências:

- `express` - Para exemplos de middleware
- `rxjs` - Para exemplos de NestJS (tap, catchError)

## 📝 Notas Importantes

1. **Ambiente**: Configure `NODE_ENV` para testar diferentes comportamentos
2. **Redação**: Os exemplos de segurança mostram como dados sensíveis são redatados
3. **Performance**: O exemplo 09 inclui testes de performance
4. **Correlação**: Use correlation IDs para rastrear requisições em sistemas distribuídos

## 🎯 Próximos Passos

1. Execute os exemplos na ordem para entender a progressão
2. Adapte os exemplos para suas necessidades específicas
3. Combine diferentes técnicas conforme necessário
4. Configure o logger para seu ambiente de produção
