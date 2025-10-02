package decorators

import (
	"context"
	"fmt"
	"reflect"
	"runtime"
	"time"

	correlationContext "github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/internal/redactor"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// LogMethodOptions representa as opções para logging de métodos
type LogMethodOptions struct {
	Level            types.LogLevel `json:"level,omitempty"`
	IncludeArgs      bool           `json:"includeArgs,omitempty"`
	IncludeResult    bool           `json:"includeResult,omitempty"`
	SampleRate       float64        `json:"sampleRate,omitempty"`
	Redact           types.Redactor `json:"-"`
	Sink             types.Sink     `json:"-"`
	GetCorrelationID func() string  `json:"-"`
}

// LogMethod decora uma função com logging automático
func LogMethod(options LogMethodOptions) func(interface{}) interface{} {
	// Configura opções padrão
	if options.Level == "" {
		options.Level = types.InfoLevel
	}
	if options.SampleRate == 0 {
		options.SampleRate = 1.0
	}
	if options.Redact == nil {
		options.Redact = redactor.DefaultRedactor()
	}
	if options.GetCorrelationID == nil {
		options.GetCorrelationID = func() string { return "" }
	}

	return func(fn interface{}) interface{} {
		fnValue := reflect.ValueOf(fn)
		fnType := fnValue.Type()

		// Verifica se é uma função
		if fnType.Kind() != reflect.Func {
			panic("LogMethod: fn must be a function")
		}

		// Cria a função decorada
		return reflect.MakeFunc(fnType, func(args []reflect.Value) []reflect.Value {
			// Aplica amostragem
			if options.SampleRate < 1.0 && !shouldSample(options.SampleRate) {
				return fnValue.Call(args)
			}

			// Obtém informações do método
			pc := fnValue.Pointer()
			funcInfo := runtime.FuncForPC(pc)
			funcName := funcInfo.Name()

			// Extrai nome da classe e método
			className, methodName := extractClassAndMethod(funcName)

			// Obtém correlation ID
			correlationID := options.GetCorrelationID()

			// Inicia medição de tempo
			startTime := time.Now()

			// Prepara argumentos para log
			var logArgs []interface{}
			if options.IncludeArgs {
				logArgs = make([]interface{}, len(args))
				for i, arg := range args {
					logArgs[i] = arg.Interface()
				}
			}

			// Executa a função original
			results := fnValue.Call(args)

			// Calcula duração
			duration := time.Since(startTime)

			// Prepara resultado para log
			var logResult interface{}
			if options.IncludeResult && len(results) > 0 {
				logResult = results[0].Interface()
			}

			// Cria entrada de log
			entry := types.LogEntry{
				Timestamp: startTime,
				Level:     options.Level,
				Scope: types.LogScope{
					ClassName:  className,
					MethodName: methodName,
				},
				Outcome:       "success",
				Args:          logArgs,
				Result:        logResult,
				CorrelationID: correlationID,
				DurationMs:    float64(duration.Nanoseconds()) / 1e6,
			}

			// Redata argumentos e resultado
			if options.IncludeArgs && entry.Args != nil {
				entry.Args = options.Redact.Redact(entry.Args).([]interface{})
			}
			if options.IncludeResult && entry.Result != nil {
				entry.Result = options.Redact.Redact(entry.Result)
			}

			// Loga a execução
			logMethodExecution(entry, options.Sink)

			return results
		}).Interface()
	}
}

// LogMethodWithContext decora uma função com logging automático e contexto
func LogMethodWithContext(ctx context.Context, options LogMethodOptions) func(interface{}) interface{} {
	// Configura função para obter correlation ID do contexto
	options.GetCorrelationID = func() string {
		return correlationContext.GetCorrelationID(ctx)
	}

	return LogMethod(options)
}

// shouldSample determina se deve fazer sample baseado na taxa
func shouldSample(sampleRate float64) bool {
	// Implementação simples - em produção use crypto/rand
	return time.Now().UnixNano()%100 < int64(sampleRate*100)
}

// extractClassAndMethod extrai nome da classe e método do nome da função
func extractClassAndMethod(funcName string) (string, string) {
	// Remove path do pacote
	lastSlash := -1
	for i := len(funcName) - 1; i >= 0; i-- {
		if funcName[i] == '/' {
			lastSlash = i
			break
		}
	}
	if lastSlash >= 0 {
		funcName = funcName[lastSlash+1:]
	}

	// Remove nome do pacote
	lastDot := -1
	for i := len(funcName) - 1; i >= 0; i-- {
		if funcName[i] == '.' {
			lastDot = i
			break
		}
	}

	if lastDot >= 0 {
		className := funcName[:lastDot]
		methodName := funcName[lastDot+1:]
		return className, methodName
	}

	return "", funcName
}

// logMethodExecution registra a execução do método
func logMethodExecution(entry types.LogEntry, sink types.Sink) {
	if sink != nil {
		// Usa o sink configurado
		sink.Write(entry)
	} else {
		// Fallback para print simples
		fmt.Printf("[%s] %s.%s - %s (%.2fms)\n",
			entry.Level,
			entry.Scope.ClassName,
			entry.Scope.MethodName,
			entry.Outcome,
			entry.DurationMs,
		)
	}
}

// LogMethodError decora uma função com logging de erro
func LogMethodError(options LogMethodOptions) func(interface{}) interface{} {
	// Configura para logar erros
	options.Level = types.ErrorLevel
	options.IncludeArgs = true
	options.IncludeResult = false

	return func(fn interface{}) interface{} {
		fnValue := reflect.ValueOf(fn)
		fnType := fnValue.Type()

		if fnType.Kind() != reflect.Func {
			panic("LogMethodError: fn must be a function")
		}

		return reflect.MakeFunc(fnType, func(args []reflect.Value) []reflect.Value {
			// Obtém informações do método
			pc := fnValue.Pointer()
			funcInfo := runtime.FuncForPC(pc)
			funcName := funcInfo.Name()

			className, methodName := extractClassAndMethod(funcName)
			correlationID := options.GetCorrelationID()
			startTime := time.Now()

			// Prepara argumentos para log
			var logArgs []interface{}
			if options.IncludeArgs {
				logArgs = make([]interface{}, len(args))
				for i, arg := range args {
					logArgs[i] = arg.Interface()
				}
			}

			// Executa a função original
			results := fnValue.Call(args)

			// Verifica se houve erro
			if len(results) > 0 {
				lastResult := results[len(results)-1]
				if lastResult.Type().Implements(reflect.TypeOf((*error)(nil)).Elem()) {
					if !lastResult.IsNil() {
						// Houve erro - loga
						duration := time.Since(startTime)

						entry := types.LogEntry{
							Timestamp: startTime,
							Level:     types.ErrorLevel,
							Scope: types.LogScope{
								ClassName:  className,
								MethodName: methodName,
							},
							Outcome: "failure",
							Args:    logArgs,
							Error: &types.LogError{
								Name:    "Error",
								Message: lastResult.Interface().(error).Error(),
							},
							CorrelationID: correlationID,
							DurationMs:    float64(duration.Nanoseconds()) / 1e6,
						}

						// Redata argumentos
						if options.IncludeArgs && entry.Args != nil {
							entry.Args = options.Redact.Redact(entry.Args).([]interface{})
						}

						logMethodExecution(entry, options.Sink)
					}
				}
			}

			return results
		}).Interface()
	}
}
