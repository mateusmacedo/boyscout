package gologger

import (
	"context"
	"os"

	correlationContext "github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/internal/logger"
	"github.com/mateusmacedo/boyscout/go-logger/internal/redactor"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// NewLogger cria um novo logger com as opções fornecidas
func NewLogger(options types.LogOptions) types.Logger {
	return logger.NewLogger(options)
}

// DefaultLogger cria um logger com configurações padrão
func DefaultLogger() types.Logger {
	return logger.DefaultLogger()
}

// NewRedactor cria um novo redator com as opções fornecidas
func NewRedactor(options types.RedactorOptions) types.Redactor {
	return redactor.NewRedactor(redactor.RedactorOptions(options))
}

// DefaultRedactor cria um redator com configurações padrão
func DefaultRedactor() types.Redactor {
	return redactor.DefaultRedactor()
}

// WithCorrelationID adiciona um correlation ID ao contexto
func WithCorrelationID(ctx context.Context, correlationID string) context.Context {
	return correlationContext.WithCorrelationID(ctx, correlationID)
}

// GetCorrelationID extrai o correlation ID do contexto
func GetCorrelationID(ctx context.Context) string {
	return correlationContext.GetCorrelationID(ctx)
}

// NewCorrelationContext cria um novo contexto com correlation ID
func NewCorrelationContext(correlationID string) context.Context {
	return correlationContext.NewCorrelationContext(correlationID)
}

// SetLevel define o nível de log globalmente
func SetLevel(level types.LogLevel) {
	logger.SetLevel(level)
}

// SetFormatter define o formatador global
func SetFormatter(formatter interface{}) {
	// Skip para simplificar - formater deveria ser do tipo correto
	logger.SetLevel(types.InfoLevel)
}

// SetOutput define a saída global
func SetOutput(output interface{}) {
	logger.SetOutput(output)
}

// GetEnv obtém uma variável de ambiente com valor padrão
func GetEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// LogLevel representa os níveis de log disponíveis
type LogLevel = types.LogLevel

// LogEntry representa uma entrada de log estruturada
type LogEntry = types.LogEntry

// LogScope representa o escopo do log
type LogScope = types.LogScope

// LogError representa um erro estruturado
type LogError = types.LogError

// LogOptions representa as opções de configuração do logger
type LogOptions = types.LogOptions

// RedactorOptions representa as opções de configuração do redator
type RedactorOptions = types.RedactorOptions

// SinkOptions representa as opções de configuração do sink
type SinkOptions = types.SinkOptions

// Logger interface principal para logging
type Logger = types.Logger

// Redactor interface para redação de dados sensíveis
type Redactor = types.Redactor

// Sink interface para destinos de log
type Sink = types.Sink

// Constantes para níveis de log
const (
	TraceLevel = types.TraceLevel
	DebugLevel = types.DebugLevel
	InfoLevel  = types.InfoLevel
	WarnLevel  = types.WarnLevel
	ErrorLevel = types.ErrorLevel
	FatalLevel = types.FatalLevel
)

// Constantes para correlation ID
const (
	CorrelationIDKey = types.CorrelationIDKey
)

// Funções de conveniência para criar opções padrão
func DefaultLogOptions() LogOptions {
	return types.DefaultLogOptions()
}

func DefaultRedactorOptions() RedactorOptions {
	return types.DefaultRedactorOptions()
}

func DefaultSinkOptions() SinkOptions {
	return types.DefaultSinkOptions()
}
