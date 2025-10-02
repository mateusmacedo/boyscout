package gologger

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestDefaultLogger(t *testing.T) {
	log := DefaultLogger()
	assert.NotNil(t, log)

	// Testa diferentes níveis de log
	log.Trace("Test trace message")
	log.Debug("Test debug message")
	log.Info("Test info message")
	log.Warn("Test warn message")
	log.Error("Test error message")
}

func TestLoggerWithFields(t *testing.T) {
	log := DefaultLogger()

	fields := map[string]interface{}{
		"userId":    "123",
		"operation": "test",
		"success":   true,
	}

	logWithFields := log.WithFields(fields)
	assert.NotNil(t, logWithFields)

	logWithFields.Info("Test message with fields")
}

func TestLoggerWithContext(t *testing.T) {
	log := DefaultLogger()

	// Cria contexto com correlation ID
	ctx := NewCorrelationContext("req-123-456")

	logWithContext := log.WithContext(ctx)
	assert.NotNil(t, logWithContext)

	logWithContext.Info("Test message with context")
}

func TestLoggerWithCorrelationID(t *testing.T) {
	log := DefaultLogger()

	logWithCID := log.WithCorrelationID("req-789-012")
	assert.NotNil(t, logWithCID)

	logWithCID.Info("Test message with correlation ID")
}

func TestRedactor(t *testing.T) {
	redactor := DefaultRedactor()
	assert.NotNil(t, redactor)

	// Dados sensíveis
	data := map[string]interface{}{
		"name":     "João Silva",
		"email":    "joao@example.com",
		"password": "senha123",
		"cpf":      "123.456.789-00",
	}

	// Redata dados sensíveis
	redacted := redactor.Redact(data)
	assert.NotNil(t, redacted)

	// Verifica se a senha foi redatada
	redactedMap := redacted.(map[string]interface{})
	assert.Equal(t, "***", redactedMap["password"])
	assert.Equal(t, "***", redactedMap["cpf"])
}

func TestRedactorWithCustomOptions(t *testing.T) {
	options := RedactorOptions{
		Keys:     []string{"secret", "token"},
		Patterns: []string{`\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b`}, // Cartão de crédito
		Mask:     "REDACTED",
		MaxDepth: 10,
	}

	redactor := NewRedactor(options)
	assert.NotNil(t, redactor)

	// Dados sensíveis
	data := map[string]interface{}{
		"name":        "João Silva",
		"secret":      "minha-senha-secreta",
		"cardNumber":  "1234 5678 9012 3456",
		"normalField": "valor normal",
	}

	// Redata dados sensíveis
	redacted := redactor.Redact(data)
	assert.NotNil(t, redacted)

	// Verifica se os campos sensíveis foram redatados
	redactedMap := redacted.(map[string]interface{})
	assert.Equal(t, "REDACTED", redactedMap["secret"])
	assert.Equal(t, "REDACTED", redactedMap["cardNumber"])
	assert.Equal(t, "valor normal", redactedMap["normalField"])
}

func TestCorrelationID(t *testing.T) {
	// Testa criação de contexto com correlation ID
	ctx := NewCorrelationContext("req-123-456")
	assert.NotNil(t, ctx)

	// Testa extração de correlation ID
	cid := GetCorrelationID(ctx)
	assert.Equal(t, "req-123-456", cid)

	// Testa adição de correlation ID a contexto existente
	ctx2 := WithCorrelationID(context.Background(), "req-789-012")
	cid2 := GetCorrelationID(ctx2)
	assert.Equal(t, "req-789-012", cid2)
}

func TestLogLevels(t *testing.T) {
	// Testa definição de nível de log
	SetLevel(InfoLevel)

	// Testa criação de logger com nível específico
	options := LogOptions{
		Level: WarnLevel,
	}

	log := NewLogger(options)
	assert.NotNil(t, log)

	log.Warn("Test warn message")
}

func TestDefaultOptions(t *testing.T) {
	// Testa opções padrão do logger
	logOptions := DefaultLogOptions()
	assert.Equal(t, InfoLevel, logOptions.Level)
	assert.True(t, logOptions.IncludeArgs)
	assert.False(t, logOptions.IncludeResult)
	assert.Equal(t, 1.0, logOptions.SampleRate)

	// Testa opções padrão do redator
	redactorOptions := DefaultRedactorOptions()
	assert.NotEmpty(t, redactorOptions.Keys)
	assert.NotEmpty(t, redactorOptions.Patterns)
	assert.Equal(t, "***", redactorOptions.Mask)
	assert.False(t, redactorOptions.KeepLengths)

	// Testa opções padrão do sink
	sinkOptions := DefaultSinkOptions()
	assert.Equal(t, "go-logger", sinkOptions.Service)
	assert.Equal(t, "development", sinkOptions.Environment)
	assert.Equal(t, "1.0.0", sinkOptions.Version)
}

func TestGetEnv(t *testing.T) {
	// Testa função GetEnv com valor padrão
	value := GetEnv("NON_EXISTENT_ENV_VAR", "default_value")
	assert.Equal(t, "default_value", value)
}

func TestLogEntry(t *testing.T) {
	// Testa criação de LogEntry
	entry := LogEntry{
		Timestamp: time.Now(),
		Level:     InfoLevel,
		Scope: LogScope{
			ClassName:  "TestService",
			MethodName: "TestMethod",
		},
		Outcome:       "success",
		CorrelationID: "req-123-456",
		DurationMs:    100.5,
	}

	assert.Equal(t, InfoLevel, entry.Level)
	assert.Equal(t, "TestService", entry.Scope.ClassName)
	assert.Equal(t, "TestMethod", entry.Scope.MethodName)
	assert.Equal(t, "success", entry.Outcome)
	assert.Equal(t, "req-123-456", entry.CorrelationID)
	assert.Equal(t, 100.5, entry.DurationMs)
	assert.NotZero(t, entry.Timestamp)
}

func TestLogError(t *testing.T) {
	// Testa criação de LogError
	err := LogError{
		Name:    "TestError",
		Message: "Test error message",
		Stack:   "stack trace here",
	}

	assert.Equal(t, "TestError", err.Name)
	assert.Equal(t, "Test error message", err.Message)
	assert.Equal(t, "stack trace here", err.Stack)
}
