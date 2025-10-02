package logger

import (
	"testing"

	"github.com/stretchr/testify/assert"

	correlationContext "github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/internal/redactor"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

func TestNewLogger(t *testing.T) {
	options := types.LogOptions{
		Level:       types.InfoLevel,
		Service:     "test-service",
		Environment: "test",
		Version:     "1.0.0",
	}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger funciona
	logger.Info("Test message")
}

func TestDefaultLogger(t *testing.T) {
	logger := DefaultLogger()
	assert.NotNil(t, logger)

	// Testa se o logger funciona
	logger.Info("Default logger test")
}

func TestLoggerWithFields(t *testing.T) {
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
	}

	logger := NewLogger(options)

	fields := map[string]interface{}{
		"userId":    123,
		"operation": "test",
		"success":   true,
	}

	loggerWithFields := logger.WithFields(fields)
	assert.NotNil(t, loggerWithFields)

	// Testa se o logger com campos funciona
	loggerWithFields.Info("Test with fields")
}

func TestLoggerWithContext(t *testing.T) {
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
	}

	logger := NewLogger(options)

	ctx := correlationContext.NewCorrelationContext("test-cid")
	loggerWithContext := logger.WithContext(ctx)
	assert.NotNil(t, loggerWithContext)

	// Testa se o logger com contexto funciona
	loggerWithContext.Info("Test with context")
}

func TestLoggerWithCorrelationID(t *testing.T) {
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
	}

	logger := NewLogger(options)

	loggerWithCID := logger.WithCorrelationID("test-correlation-id")
	assert.NotNil(t, loggerWithCID)

	// Testa se o logger com correlation ID funciona
	loggerWithCID.Info("Test with correlation ID")
}

func TestLoggerLevels(t *testing.T) {
	options := types.LogOptions{
		Level:   types.DebugLevel,
		Service: "test-service",
	}

	logger := NewLogger(options)

	// Testa todos os níveis
	logger.Trace("Trace message")
	logger.Debug("Debug message")
	logger.Info("Info message")
	logger.Warn("Warn message")
	logger.Error("Error message")
	logger.Fatal("Fatal message")
}

func TestLoggerWithRedactor(t *testing.T) {
	redactor := redactor.DefaultRedactor()

	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
		Redact:  redactor,
	}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger com redator funciona
	logger.Info("Test with redactor")
}

func TestLoggerWithCustomRedactor(t *testing.T) {
	customRedactor := redactor.NewRedactor(redactor.RedactorOptions{
		Keys: []string{"secret"},
		Mask: "HIDDEN",
	})

	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
		Redact:  customRedactor,
	}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger com redator customizado funciona
	logger.Info("Test with custom redactor")
}

func TestLoggerWithSink(t *testing.T) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry
	mockSink := &mockSink{
		logs: &capturedLogs,
	}

	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
		Sink:    mockSink,
	}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger com sink funciona
	logger.Info("Test with sink")

	// Verifica se o log foi capturado
	assert.Len(t, capturedLogs, 1)
	assert.Equal(t, types.InfoLevel, capturedLogs[0].Level)
}

func TestLoggerWithCorrelationIDFunction(t *testing.T) {
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
		GetCorrelationID: func() string {
			return "custom-correlation-id"
		},
	}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger com função de correlation ID funciona
	logger.Info("Test with correlation ID function")
}

func TestLoggerWithFieldsAndContext(t *testing.T) {
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
	}

	logger := NewLogger(options)

	// Adiciona campos
	fields := map[string]interface{}{
		"userId": 123,
	}
	loggerWithFields := logger.WithFields(fields)

	// Adiciona contexto
	ctx := correlationContext.NewCorrelationContext("test-cid")
	loggerWithContext := loggerWithFields.WithContext(ctx)

	// Adiciona correlation ID
	loggerWithCID := loggerWithContext.WithCorrelationID("test-correlation-id")

	assert.NotNil(t, loggerWithCID)

	// Testa se o logger com tudo funciona
	loggerWithCID.Info("Test with fields, context and correlation ID")
}

func TestLoggerErrorHandling(t *testing.T) {
	options := types.LogOptions{
		Level:   types.ErrorLevel,
		Service: "test-service",
	}

	logger := NewLogger(options)

	// Testa logging de erro
	logger.Error("Test error message")
}

func TestLoggerFatalHandling(t *testing.T) {
	options := types.LogOptions{
		Level:   types.FatalLevel,
		Service: "test-service",
	}

	logger := NewLogger(options)

	// Testa logging fatal
	logger.Fatal("Test fatal message")
}

func TestLoggerWithEmptyOptions(t *testing.T) {
	options := types.LogOptions{}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger funciona com opções vazias
	logger.Info("Test with empty options")
}

func TestLoggerWithNilRedactor(t *testing.T) {
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
		Redact:  nil, // Redator nil deve usar o padrão
	}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger funciona com redator nil
	logger.Info("Test with nil redactor")
}

func TestLoggerWithNilSink(t *testing.T) {
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "test-service",
		Sink:    nil, // Sink nil deve usar o padrão
	}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger funciona com sink nil
	logger.Info("Test with nil sink")
}

func TestLoggerWithNilCorrelationIDFunction(t *testing.T) {
	options := types.LogOptions{
		Level:            types.InfoLevel,
		Service:          "test-service",
		GetCorrelationID: nil, // Função nil deve usar a padrão
	}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger funciona com função nil
	logger.Info("Test with nil correlation ID function")
}

func TestLoggerWithAllOptions(t *testing.T) {
	redactor := redactor.DefaultRedactor()

	options := types.LogOptions{
		Level:       types.DebugLevel,
		Service:     "test-service",
		Environment: "test",
		Version:     "1.0.0",
		Redact:      redactor,
		GetCorrelationID: func() string {
			return "test-cid"
		},
		Fields: map[string]interface{}{
			"customField": "customValue",
		},
	}

	logger := NewLogger(options)
	assert.NotNil(t, logger)

	// Testa se o logger funciona com todas as opções
	logger.Info("Test with all options")
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
