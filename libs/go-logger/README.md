# boyscout/go-logger

Biblioteca Go para logging estruturado com redação de dados sensíveis, correlação de requisições e integração com frameworks web.

## 🚀 Funcionalidades

- **Logger estruturado** com níveis de log configuráveis
- **Redação de dados sensíveis** com padrões regex personalizáveis
- **Correlação de requisições** via context.Context
- **Logging automático de métodos** via decorators
- **Middlewares para Gin e Echo** com correlação automática
- **Integração com ElasticAPM** via formatação ECS
- **TypeScript First** - API consistente com a versão TypeScript

## 📦 Instalação

```bash
go get github.com/mateusmacedo/boyscout/go-logger
```

## 🎯 Uso Básico

### Logger Simples

```go
package main

import (
    "github.com/mateusmacedo/boyscout/go-logger"
)

func main() {
    // Cria logger com configurações padrão
    log := gologger.DefaultLogger()
    
    // Diferentes níveis de log
    log.Trace("Mensagem de trace")
    log.Debug("Mensagem de debug")
    log.Info("Mensagem de info")
    log.Warn("Mensagem de warning")
    log.Error("Mensagem de error")
    log.Fatal("Mensagem de fatal")
    
    // Campos estruturados
    log.Info("Operação concluída", map[string]interface{}{
        "operation": "user_creation",
        "duration":  "250ms",
        "userId":    "123",
        "success":   true,
    })
}
```

### Logger com Configuração Personalizada

```go
package main

import (
    "github.com/mateusmacedo/boyscout/go-logger"
)

func main() {
    // Configura opções do logger
    options := gologger.LogOptions{
        Service:     "my-service",
        Environment: "production",
        Version:     "1.0.0",
        Level:       gologger.InfoLevel,
    }
    
    // Cria logger personalizado
    log := gologger.NewLogger(options)
    
    log.Info("Logger configurado", map[string]interface{}{
        "service": options.Service,
        "env":     options.Environment,
    })
}
```

### Redação de Dados Sensíveis

```go
package main

import (
    "github.com/mateusmacedo/boyscout/go-logger"
)

func main() {
    // Configura redator personalizado
    redactorOptions := gologger.RedactorOptions{
        Keys: []string{"password", "token", "secret"},
        Patterns: []string{
            `\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b`, // CPF
            `\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b`, // Email
        },
        Mask: "***",
        KeepLengths: false,
    }
    
    redactor := gologger.NewRedactor(redactorOptions)
    
    // Dados sensíveis
    userData := map[string]interface{}{
        "name":     "João Silva",
        "email":    "joao@example.com",
        "password": "senha123",
        "cpf":      "123.456.789-00",
    }
    
    // Redata dados sensíveis
    redacted := redactor.Redact(userData)
    fmt.Printf("Dados redatados: %+v\n", redacted)
}
```

### Correlação de Requisições

```go
package main

import (
    "context"
    "github.com/mateusmacedo/boyscout/go-logger"
)

func main() {
    // Cria contexto com correlation ID
    ctx := gologger.NewCorrelationContext("req-123-456")
    
    // Cria logger com contexto
    log := gologger.DefaultLogger().WithContext(ctx)
    
    log.Info("Operação iniciada", map[string]interface{}{
        "operation": "user_creation",
    })
    
    // O correlation ID será automaticamente incluído nos logs
}
```

### Logging Automático de Métodos

```go
package main

import (
    "github.com/mateusmacedo/boyscout/go-logger"
    "github.com/mateusmacedo/boyscout/go-logger/internal/decorators"
)

// Função que será decorada
func ProcessPayment(amount float64, cardNumber string) error {
    // Simula processamento
    time.Sleep(100 * time.Millisecond)
    return nil
}

func main() {
    // Configura opções do decorator
    options := decorators.LogMethodOptions{
        Level:         gologger.InfoLevel,
        IncludeArgs:   true,
        IncludeResult: false,
        SampleRate:    1.0,
        Redact:        gologger.DefaultRedactor(),
    }
    
    // Aplica decorator
    decoratedFunc := decorators.LogMethod(options)(ProcessPayment)
    
    // Chama função decorada
    err := decoratedFunc.(func(float64, string) error)(100.50, "1234-5678-9012-3456")
    if err != nil {
        log.Error("Erro no pagamento", map[string]interface{}{
            "error": err.Error(),
        })
    }
}
```

## 🌐 Middlewares para Frameworks Web

### Gin

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/mateusmacedo/boyscout/go-logger"
    "github.com/mateusmacedo/boyscout/go-logger/pkg/gin"
)

func main() {
    // Configura logger
    log := gologger.DefaultLogger()
    
    // Configura Gin
    r := gin.New()
    
    // Aplica middlewares
    r.Use(gin.CorrelationIDMiddleware())
    r.Use(gin.LoggingMiddleware(log))
    r.Use(gin.ErrorLoggingMiddleware(log))
    
    // Rotas
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })
    
    r.Run(":8080")
}
```

### Echo

```go
package main

import (
    "github.com/labstack/echo/v4"
    "github.com/mateusmacedo/boyscout/go-logger"
    "github.com/mateusmacedo/boyscout/go-logger/pkg/echo"
)

func main() {
    // Configura logger
    log := gologger.DefaultLogger()
    
    // Cria Echo
    e := echo.New()
    
    // Aplica middlewares
    e.Use(echo.CorrelationIDMiddleware())
    e.Use(echo.LoggingMiddleware(log))
    e.Use(echo.ErrorLoggingMiddleware(log))
    
    // Rotas
    e.GET("/health", func(c echo.Context) error {
        return c.JSON(200, map[string]interface{}{
            "status": "ok",
        })
    })
    
    e.Logger.Fatal(e.Start(":8080"))
}
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente

```bash
# Nível de log
export LOG_LEVEL=info

# Ambiente
export GO_ENV=production

# Nome do serviço
export SERVICE_NAME=my-service

# Versão do serviço
export SERVICE_VERSION=1.0.0
```

### Configuração via Código

```go
package main

import (
    "github.com/mateusmacedo/boyscout/go-logger"
)

func main() {
    // Configura logger global
    gologger.SetLevel(gologger.InfoLevel)
    
    // Configura redator global
    redactor := gologger.NewRedactor(gologger.RedactorOptions{
        Keys: []string{"password", "token", "secret"},
        Mask: "***",
    })
    
    // Cria logger com redator personalizado
    options := gologger.LogOptions{
        Service:     "my-service",
        Environment: "production",
        Version:     "1.0.0",
        Redact:      redactor,
    }
    
    log := gologger.NewLogger(options)
    
    // Usa o logger
    log.Info("Logger configurado")
}
```

## 📊 Exemplos

### Exemplo Básico

```bash
go run examples/basic/main.go
```

### Exemplo Avançado

```bash
go run examples/advanced/main.go
```

### Exemplo com ElasticAPM

```bash
go run examples/elasticapm/main.go
```

### Exemplo de Benchmark

```bash
go run examples/benchmark/main.go
```

### Exemplo com Gin

```bash
go run examples/web/gin/main.go
```

### Exemplo com Echo

```bash
go run examples/web/echo/main.go
```

## 🧪 Testes

```bash
# Executa todos os testes
make test

# Executa testes com cobertura
make test-coverage

# Executa benchmarks
make benchmark
```

## 📚 API Reference

### Tipos Principais

- `Logger` - Interface principal para logging
- `Redactor` - Interface para redação de dados sensíveis
- `Sink` - Interface para destinos de log
- `LogEntry` - Estrutura de entrada de log
- `LogOptions` - Opções de configuração do logger
- `RedactorOptions` - Opções de configuração do redator

### Níveis de Log

- `TraceLevel` - Logs de trace
- `DebugLevel` - Logs de debug
- `InfoLevel` - Logs de informação
- `WarnLevel` - Logs de warning
- `ErrorLevel` - Logs de erro
- `FatalLevel` - Logs de fatal

### Funções de Conveniência

- `NewLogger(options)` - Cria novo logger
- `DefaultLogger()` - Cria logger com configurações padrão
- `NewRedactor(options)` - Cria novo redator
- `DefaultRedactor()` - Cria redator com configurações padrão
- `WithCorrelationID(ctx, cid)` - Adiciona correlation ID ao contexto
- `GetCorrelationID(ctx)` - Extrai correlation ID do contexto

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🔗 Links Relacionados

- [Versão TypeScript](https://github.com/mateusmacedo/boyscout/tree/main/libs/node-logger)
- [Documentação da API](docs/api.md)
- [Guia de Migração](docs/migration.md)
- [Exemplos](examples/)
