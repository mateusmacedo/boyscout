package types

import (
	"context"
	"time"
)

// LogLevel representa os níveis de log disponíveis
type LogLevel string

const (
	TraceLevel LogLevel = "trace"
	DebugLevel LogLevel = "debug"
	InfoLevel  LogLevel = "info"
	WarnLevel  LogLevel = "warn"
	ErrorLevel LogLevel = "error"
	FatalLevel LogLevel = "fatal"
)

// LogEntry representa uma entrada de log estruturada
type LogEntry struct {
	Timestamp     time.Time              `json:"timestamp"`
	Level         LogLevel               `json:"level"`
	Scope         LogScope               `json:"scope"`
	Outcome       string                 `json:"outcome"` // "success" ou "failure"
	Args          []interface{}          `json:"args,omitempty"`
	Result        interface{}            `json:"result,omitempty"`
	Error         *LogError              `json:"error,omitempty"`
	CorrelationID string                 `json:"correlationId,omitempty"`
	DurationMs    float64                `json:"durationMs"`
	Fields        map[string]interface{} `json:"fields,omitempty"`
}

// LogScope representa o escopo do log (classe/método)
type LogScope struct {
	ClassName  string `json:"className,omitempty"`
	MethodName string `json:"methodName"`
}

// LogError representa um erro estruturado
type LogError struct {
	Name    string `json:"name"`
	Message string `json:"message"`
	Stack   string `json:"stack,omitempty"`
}

// LogOptions representa as opções de configuração do logger
type LogOptions struct {
	Level            LogLevel               `json:"level,omitempty"`
	IncludeArgs      bool                   `json:"includeArgs,omitempty"`
	IncludeResult    bool                   `json:"includeResult,omitempty"`
	SampleRate       float64                `json:"sampleRate,omitempty"`
	Redact           Redactor               `json:"-"`
	Sink             Sink                   `json:"-"`
	GetCorrelationID func() string          `json:"-"`
	Fields           map[string]interface{} `json:"fields,omitempty"`
	Service          string                 `json:"service,omitempty"`
	Environment      string                 `json:"environment,omitempty"`
	Version          string                 `json:"version,omitempty"`
}

// Logger interface principal para logging
type Logger interface {
	Trace(msg string, fields ...map[string]interface{})
	Debug(msg string, fields ...map[string]interface{})
	Info(msg string, fields ...map[string]interface{})
	Warn(msg string, fields ...map[string]interface{})
	Error(msg string, fields ...map[string]interface{})
	Fatal(msg string, fields ...map[string]interface{})

	WithFields(fields map[string]interface{}) Logger
	WithContext(ctx context.Context) Logger
	WithCorrelationID(cid string) Logger
}

// Redactor interface para redação de dados sensíveis
type Redactor interface {
	Redact(data interface{}) interface{}
}

// Sink interface para destinos de log
type Sink interface {
	Write(entry LogEntry) error
	Close() error
}

// RedactorOptions representa as opções de configuração do redator
type RedactorOptions struct {
	Keys               []string `json:"keys,omitempty"`
	Patterns           []string `json:"patterns,omitempty"`
	Mask               string   `json:"mask,omitempty"`
	MaxDepth           int      `json:"maxDepth,omitempty"`
	KeepLengths        bool     `json:"keepLengths,omitempty"`
	RedactArrayIndices bool     `json:"redactArrayIndices,omitempty"`
}

// SinkOptions representa as opções de configuração do sink
type SinkOptions struct {
	Service            string                 `json:"service,omitempty"`
	Environment        string                 `json:"environment,omitempty"`
	Version            string                 `json:"version,omitempty"`
	EnableBackpressure bool                   `json:"enableBackpressure,omitempty"`
	BufferSize         int                    `json:"bufferSize,omitempty"`
	FlushInterval      time.Duration          `json:"flushInterval,omitempty"`
	Fields             map[string]interface{} `json:"fields,omitempty"`
}

// ContextKey tipo para chaves de contexto
type ContextKey string

const (
	// CorrelationIDKey chave para correlation ID no contexto
	CorrelationIDKey ContextKey = "correlationId"
)

// LogMethodOptions representa opções específicas para logging de métodos
type LogMethodOptions struct {
	Level            LogLevel      `json:"level,omitempty"`
	IncludeArgs      bool          `json:"includeArgs,omitempty"`
	IncludeResult    bool          `json:"includeResult,omitempty"`
	SampleRate       float64       `json:"sampleRate,omitempty"`
	Redact           Redactor      `json:"-"`
	GetCorrelationID func() string `json:"-"`
}

// DefaultLogOptions retorna as opções padrão para logging
func DefaultLogOptions() LogOptions {
	return LogOptions{
		Level:            InfoLevel,
		IncludeArgs:      true,
		IncludeResult:    false,
		SampleRate:       1.0,
		GetCorrelationID: func() string { return "" },
	}
}

// DefaultRedactorOptions retorna as opções padrão para o redator
func DefaultRedactorOptions() RedactorOptions {
	return RedactorOptions{
		Keys: []string{
			"password", "passwd", "pass", "pwd",
			"token", "access_token", "refresh_token",
			"authorization", "auth", "secret",
			"apiKey", "api_key", "apikey",
			"client_secret", "card", "cardNumber",
			"cvv", "cvc", "ssn", "cpf", "cnpj",
		},
		Patterns: []string{
			`\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b`,          // CPF
			`\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b`,  // CNPJ
			`\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b`, // Email
			`\b(?:[A-Fa-f0-9]{32,64})\b`,                // Hashes
		},
		Mask:               "***",
		MaxDepth:           5,
		KeepLengths:        false,
		RedactArrayIndices: true,
	}
}

// DefaultSinkOptions retorna as opções padrão para o sink
func DefaultSinkOptions() SinkOptions {
	return SinkOptions{
		Service:            "go-logger",
		Environment:        "development",
		Version:            "1.0.0",
		EnableBackpressure: true,
		BufferSize:         1000,
		FlushInterval:      5 * time.Second,
	}
}
