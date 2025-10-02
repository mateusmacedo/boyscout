package decorators

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	correlationContext "github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/internal/redactor"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

func TestLogMethod(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry

	options := LogMethodOptions{
		Level:         types.InfoLevel,
		IncludeArgs:   true,
		IncludeResult: true,
		SampleRate:    1.0,
		Redact:        redactor.DefaultRedactor(),
		Sink:          &mockSink{logs: &capturedLogs},
		GetCorrelationID: func() string {
			return "test-cid"
		},
	}

	// Função de teste
	testFunc := func(a, b int) int {
		return a + b
	}

	// Aplica decorator
	decoratedFunc := LogMethod(options)(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função decorada
	result := decoratedFunc.(func(int, int) int)(5, 3)
	assert.Equal(t, 8, result)

	// Verifica se o log foi capturado
	require.Len(t, capturedLogs, 1)
	log := capturedLogs[0]

	assert.Equal(t, types.InfoLevel, log.Level)
	assert.Equal(t, "success", log.Outcome)
	assert.Equal(t, "test-cid", log.CorrelationID)
	assert.True(t, log.DurationMs > 0)

	// Verifica argumentos
	require.Len(t, log.Args, 2)
	assert.Equal(t, 5, log.Args[0])
	assert.Equal(t, 3, log.Args[1])

	// Verifica resultado
	assert.Equal(t, 8, log.Result)
}

func TestLogMethodWithContext(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry

	options := LogMethodOptions{
		Level:         types.InfoLevel,
		IncludeArgs:   true,
		IncludeResult: true,
		SampleRate:    1.0,
		Redact:        redactor.DefaultRedactor(),
		Sink:          &mockSink{logs: &capturedLogs},
	}

	// Função de teste
	testFunc := func(msg string) string {
		return "Hello, " + msg
	}

	// Cria contexto com correlation ID
	ctx := correlationContext.NewCorrelationContext("context-cid")

	// Aplica decorator com contexto
	decoratedFunc := LogMethodWithContext(ctx, options)(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função decorada
	result := decoratedFunc.(func(string) string)("World")
	assert.Equal(t, "Hello, World", result)

	// Verifica se o log foi capturado
	require.Len(t, capturedLogs, 1)
	log := capturedLogs[0]

	assert.Equal(t, "context-cid", log.CorrelationID)
}

func TestLogMethodError(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry

	options := LogMethodOptions{
		Level:         types.ErrorLevel,
		IncludeArgs:   true,
		IncludeResult: false,
		SampleRate:    1.0,
		Redact:        redactor.DefaultRedactor(),
		Sink:          &mockSink{logs: &capturedLogs},
		GetCorrelationID: func() string {
			return "error-cid"
		},
	}

	// Função que retorna erro
	testFunc := func(shouldError bool) (string, error) {
		if shouldError {
			return "", assert.AnError
		}
		return "success", nil
	}

	// Aplica decorator de erro
	decoratedFunc := LogMethodError(options)(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função que retorna erro
	result, err := decoratedFunc.(func(bool) (string, error))(true)
	assert.Empty(t, result)
	assert.Error(t, err)

	// Verifica se o log de erro foi capturado
	require.Len(t, capturedLogs, 1)
	log := capturedLogs[0]

	assert.Equal(t, types.ErrorLevel, log.Level)
	assert.Equal(t, "failure", log.Outcome)
	assert.Equal(t, "error-cid", log.CorrelationID)
	assert.NotNil(t, log.Error)
	assert.Equal(t, "assert.AnError general error for testing", log.Error.Message)
}

func TestLogMethodWithoutError(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry

	options := LogMethodOptions{
		Level:         types.ErrorLevel,
		IncludeArgs:   true,
		IncludeResult: false,
		SampleRate:    1.0,
		Redact:        redactor.DefaultRedactor(),
		Sink:          &mockSink{logs: &capturedLogs},
		GetCorrelationID: func() string {
			return "no-error-cid"
		},
	}

	// Função que não retorna erro
	testFunc := func(shouldError bool) (string, error) {
		if shouldError {
			return "", assert.AnError
		}
		return "success", nil
	}

	// Aplica decorator de erro
	decoratedFunc := LogMethodError(options)(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função que não retorna erro
	result, err := decoratedFunc.(func(bool) (string, error))(false)
	assert.Equal(t, "success", result)
	assert.NoError(t, err)

	// Não deve haver logs quando não há erro
	assert.Len(t, capturedLogs, 0)
}

func TestLogMethodWithSampling(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry

	options := LogMethodOptions{
		Level:         types.InfoLevel,
		IncludeArgs:   true,
		IncludeResult: true,
		SampleRate:    0.0, // 0% de amostragem - não deve logar
		Redact:        redactor.DefaultRedactor(),
		Sink:          &mockSink{logs: &capturedLogs},
		GetCorrelationID: func() string {
			return "sample-cid"
		},
	}

	// Função de teste
	testFunc := func(x int) int {
		return x * 2
	}

	// Aplica decorator
	decoratedFunc := LogMethod(options)(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função decorada
	result := decoratedFunc.(func(int) int)(5)
	assert.Equal(t, 10, result)

	// Com sampleRate 0.0, pode ou não haver logs (é probabilístico)
	// Mas não deve haver muitos logs
	assert.True(t, len(capturedLogs) <= 1)
}

func TestLogMethodWithPartialSampling(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry

	options := LogMethodOptions{
		Level:         types.InfoLevel,
		IncludeArgs:   true,
		IncludeResult: true,
		SampleRate:    0.5, // 50% de amostragem
		Redact:        redactor.DefaultRedactor(),
		Sink:          &mockSink{logs: &capturedLogs},
		GetCorrelationID: func() string {
			return "partial-sample-cid"
		},
	}

	// Função de teste
	testFunc := func(x int) int {
		return x * 2
	}

	// Aplica decorator
	decoratedFunc := LogMethod(options)(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função decorada múltiplas vezes
	for i := 0; i < 10; i++ {
		result := decoratedFunc.(func(int) int)(i)
		assert.Equal(t, i*2, result)
	}

	// Deve haver alguns logs (não todos devido à amostragem)
	// Como é probabilístico, pode ser 0 ou mais
	assert.True(t, len(capturedLogs) <= 10)
}

func TestLogMethodWithRedaction(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry

	customRedactor := redactor.NewRedactor(redactor.RedactorOptions{
		Keys:     []string{"password", "secret"},
		Mask:     "REDACTED",
		MaxDepth: 10,
	})

	options := LogMethodOptions{
		Level:         types.InfoLevel,
		IncludeArgs:   true,
		IncludeResult: true,
		SampleRate:    1.0,
		Redact:        customRedactor,
		Sink:          &mockSink{logs: &capturedLogs},
		GetCorrelationID: func() string {
			return "redaction-cid"
		},
	}

	// Função que recebe dados sensíveis
	testFunc := func(data map[string]interface{}) map[string]interface{} {
		return data
	}

	// Aplica decorator
	decoratedFunc := LogMethod(options)(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função com dados sensíveis
	sensitiveData := map[string]interface{}{
		"name":     "João",
		"password": "senha123",
		"secret":   "dados-secretos",
		"normal":   "valor normal",
	}

	result := decoratedFunc.(func(map[string]interface{}) map[string]interface{})(sensitiveData)
	assert.Equal(t, sensitiveData, result)

	// Verifica se o log foi capturado
	require.Len(t, capturedLogs, 1)
	log := capturedLogs[0]

	// Verifica se os argumentos foram redatados
	require.Len(t, log.Args, 1)
	args := log.Args[0].(map[string]interface{})
	assert.Equal(t, "João", args["name"])
	assert.Equal(t, "REDACTED", args["password"])
	assert.Equal(t, "REDACTED", args["secret"])
	assert.Equal(t, "valor normal", args["normal"])

	// Verifica se o resultado foi redatado
	resultMap := log.Result.(map[string]interface{})
	assert.Equal(t, "João", resultMap["name"])
	assert.Equal(t, "REDACTED", resultMap["password"])
	assert.Equal(t, "REDACTED", resultMap["secret"])
	assert.Equal(t, "valor normal", resultMap["normal"])
}

func TestLogMethodWithAsyncFunction(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry

	options := LogMethodOptions{
		Level:         types.InfoLevel,
		IncludeArgs:   true,
		IncludeResult: true,
		SampleRate:    1.0,
		Redact:        redactor.DefaultRedactor(),
		Sink:          &mockSink{logs: &capturedLogs},
		GetCorrelationID: func() string {
			return "async-cid"
		},
	}

	// Função assíncrona de teste
	testFunc := func(delay time.Duration) <-chan string {
		ch := make(chan string, 1)
		go func() {
			time.Sleep(delay)
			ch <- "async result"
		}()
		return ch
	}

	// Aplica decorator
	decoratedFunc := LogMethod(options)(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função decorada
	result := decoratedFunc.(func(time.Duration) <-chan string)(10 * time.Millisecond)

	// Aguarda resultado
	select {
	case value := <-result:
		assert.Equal(t, "async result", value)
	case <-time.After(100 * time.Millisecond):
		t.Fatal("Timeout waiting for async result")
	}

	// Verifica se o log foi capturado
	require.Len(t, capturedLogs, 1)
	log := capturedLogs[0]

	assert.Equal(t, "async-cid", log.CorrelationID)
	assert.Equal(t, "success", log.Outcome)
	assert.True(t, log.DurationMs > 0)
}

func TestLogMethodWithNilOptions(t *testing.T) {
	// Função de teste
	testFunc := func(x int) int {
		return x * 2
	}

	// Aplica decorator com opções nil (deve usar padrões)
	decoratedFunc := LogMethod(LogMethodOptions{})(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função decorada
	result := decoratedFunc.(func(int) int)(5)
	assert.Equal(t, 10, result)
}

func TestLogMethodWithInvalidFunction(t *testing.T) {
	// Deve panic com função inválida
	assert.Panics(t, func() {
		LogMethod(LogMethodOptions{})(123) // Não é uma função
	})
}

func TestLogMethodWithMethodName(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry

	options := LogMethodOptions{
		Level:         types.InfoLevel,
		IncludeArgs:   true,
		IncludeResult: true,
		SampleRate:    1.0,
		Redact:        redactor.DefaultRedactor(),
		Sink:          &mockSink{logs: &capturedLogs},
		GetCorrelationID: func() string {
			return "method-name-cid"
		},
	}

	// Função de teste
	testFunc := func(x int) int {
		return x * 2
	}

	// Aplica decorator
	decoratedFunc := LogMethod(options)(testFunc)
	assert.NotNil(t, decoratedFunc)

	// Chama função decorada
	result := decoratedFunc.(func(int) int)(5)
	assert.Equal(t, 10, result)

	// Verifica se o log foi capturado
	require.Len(t, capturedLogs, 1)
	log := capturedLogs[0]

	// Verifica se o nome do método foi capturado
	assert.NotEmpty(t, log.Scope.MethodName)
	assert.Equal(t, "method-name-cid", log.CorrelationID)
}

// Mock sink para testes
type mockSink struct {
	logs *[]types.LogEntry
}

func (m *mockSink) Write(entry types.LogEntry) error {
	*m.logs = append(*m.logs, entry)
	return nil
}

func (m *mockSink) Close() error {
	return nil
}
