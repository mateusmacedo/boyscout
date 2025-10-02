package logger

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/sirupsen/logrus"

	correlationContext "github.com/mateusmacedo/boyscout/go-logger/internal/context"
	redactorPkg "github.com/mateusmacedo/boyscout/go-logger/internal/redactor"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// logger implementa a interface Logger
type logger struct {
	entry    *logrus.Entry
	redactor types.Redactor
	options  types.LogOptions
}

// NewLogger cria um novo logger com as opções fornecidas
func NewLogger(options types.LogOptions) types.Logger {
	// Configura o logrus
	log := logrus.New()

	// Define o nível de log
	level, err := logrus.ParseLevel(string(options.Level))
	if err != nil {
		level = logrus.InfoLevel
	}
	log.SetLevel(level)

	// Configura o formato
	if options.Environment == "development" {
		log.SetFormatter(&logrus.TextFormatter{
			TimestampFormat: time.RFC3339,
			FullTimestamp:   true,
		})
	} else {
		log.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339,
		})
	}

	// Define a saída
	log.SetOutput(os.Stdout)

	// Cria o entry base
	entry := log.WithFields(logrus.Fields{
		"service":     options.Service,
		"environment": options.Environment,
		"version":     options.Version,
	})

	// Adiciona campos customizados
	if options.Fields != nil {
		entry = entry.WithFields(options.Fields)
	}

	// Configura o redator
	var finalRedactor types.Redactor
	if options.Redact != nil {
		finalRedactor = options.Redact
	} else {
		finalRedactor = redactorPkg.DefaultRedactor()
	}

	return &logger{
		entry:    entry,
		redactor: finalRedactor,
		options:  options,
	}
}

// Trace registra um log de nível trace
func (l *logger) Trace(msg string, fields ...map[string]interface{}) {
	l.log(types.TraceLevel, msg, fields...)
}

// Debug registra um log de nível debug
func (l *logger) Debug(msg string, fields ...map[string]interface{}) {
	l.log(types.DebugLevel, msg, fields...)
}

// Info registra um log de nível info
func (l *logger) Info(msg string, fields ...map[string]interface{}) {
	l.log(types.InfoLevel, msg, fields...)
}

// Warn registra um log de nível warn
func (l *logger) Warn(msg string, fields ...map[string]interface{}) {
	l.log(types.WarnLevel, msg, fields...)
}

// Error registra um log de nível error
func (l *logger) Error(msg string, fields ...map[string]interface{}) {
	l.log(types.ErrorLevel, msg, fields...)
}

// Fatal registra um log de nível fatal
func (l *logger) Fatal(msg string, fields ...map[string]interface{}) {
	l.log(types.FatalLevel, msg, fields...)
}

// WithFields cria um novo logger com campos adicionais
func (l *logger) WithFields(fields map[string]interface{}) types.Logger {
	// Redata os campos se necessário
	redactedFields := make(map[string]interface{})
	for k, v := range fields {
		redactedFields[k] = l.redactor.Redact(v)
	}

	return &logger{
		entry:    l.entry.WithFields(redactedFields),
		redactor: l.redactor,
		options:  l.options,
	}
}

// WithContext cria um novo logger com contexto
func (l *logger) WithContext(ctx context.Context) types.Logger {
	// Extrai correlation ID do contexto
	cid := correlationContext.GetCorrelationID(ctx)

	fields := make(map[string]interface{})
	if cid != "" {
		fields["correlationId"] = cid
	}

	return l.WithFields(fields)
}

// WithCorrelationID cria um novo logger com correlation ID
func (l *logger) WithCorrelationID(cid string) types.Logger {
	fields := map[string]interface{}{
		"correlationId": cid,
	}

	return l.WithFields(fields)
}

// log método interno para registrar logs
func (l *logger) log(level types.LogLevel, msg string, fields ...map[string]interface{}) {
	// Combina todos os campos
	allFields := make(map[string]interface{})

	// Adiciona campos do logger base
	if l.entry.Data != nil {
		for k, v := range l.entry.Data {
			allFields[k] = v
		}
	}

	// Adiciona campos fornecidos
	for _, fieldMap := range fields {
		for k, v := range fieldMap {
			allFields[k] = v
		}
	}

	// Redata os campos se necessário
	redactedFields := make(map[string]interface{})
	for k, v := range allFields {
		redactedFields[k] = l.redactor.Redact(v)
	}

	// Cria entry com campos redatados
	entry := l.entry.Logger.WithFields(redactedFields)

	// Registra o log
	switch level {
	case types.TraceLevel:
		entry.Trace(msg)
	case types.DebugLevel:
		entry.Debug(msg)
	case types.InfoLevel:
		entry.Info(msg)
	case types.WarnLevel:
		entry.Warn(msg)
	case types.ErrorLevel:
		entry.Error(msg)
	case types.FatalLevel:
		entry.Fatal(msg)
	}
}

// LogMethod registra a execução de um método
func (l *logger) LogMethod(entry types.LogEntry) {
	// Redata argumentos e resultado se necessário
	if l.options.IncludeArgs && entry.Args != nil {
		entry.Args = l.redactor.Redact(entry.Args).([]interface{})
	}

	if l.options.IncludeResult && entry.Result != nil {
		entry.Result = l.redactor.Redact(entry.Result)
	}

	// Cria campos para o log
	fields := map[string]interface{}{
		"scope":      entry.Scope,
		"outcome":    entry.Outcome,
		"durationMs": entry.DurationMs,
	}

	if entry.CorrelationID != "" {
		fields["correlationId"] = entry.CorrelationID
	}

	if entry.Args != nil {
		fields["args"] = entry.Args
	}

	if entry.Result != nil {
		fields["result"] = entry.Result
	}

	if entry.Error != nil {
		fields["error"] = entry.Error
	}

	// Registra o log
	l.log(entry.Level, fmt.Sprintf("%s.%s", entry.Scope.ClassName, entry.Scope.MethodName), fields)
}

// DefaultLogger cria um logger com configurações padrão
func DefaultLogger() types.Logger {
	options := types.DefaultLogOptions()
	options.Service = "go-logger"
	options.Environment = getEnv("GO_ENV", "development")
	options.Version = getEnv("SERVICE_VERSION", "1.0.0")

	return NewLogger(options)
}

// getEnv obtém uma variável de ambiente com valor padrão
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// SetLevel define o nível de log globalmente
func SetLevel(level types.LogLevel) {
	logrusLevel, err := logrus.ParseLevel(string(level))
	if err != nil {
		logrusLevel = logrus.InfoLevel
	}
	logrus.SetLevel(logrusLevel)
}

// SetFormatter define o formatador global
func SetFormatter(formatter logrus.Formatter) {
	logrus.SetFormatter(formatter)
}

// SetOutput define a saída global
func SetOutput(output interface{}) {
	logrus.SetOutput(output.(*os.File))
}
