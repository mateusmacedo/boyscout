package main

import (
	"fmt"
	"testing"
	"time"

	correlationContext "github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/internal/logger"
	"github.com/mateusmacedo/boyscout/go-logger/internal/redactor"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// BenchmarkLogger demonstra performance do logger
func BenchmarkLogger(b *testing.B) {
	// Configura logger para benchmark
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "benchmark-service",
	}

	log := logger.NewLogger(options)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		log.Info("Benchmark message", map[string]interface{}{
			"iteration": i,
			"timestamp": time.Now(),
		})
	}
}

// BenchmarkLoggerWithRedaction demonstra performance com redação
func BenchmarkLoggerWithRedaction(b *testing.B) {
	// Configura redator
	redactor := redactor.NewRedactor(redactor.RedactorOptions{
		Keys:     []string{"password", "cardNumber", "ssn"},
		Patterns: []string{`\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b`},
		Mask:     "REDACTED",
		MaxDepth: 10,
	})

	// Configura logger com redator
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "benchmark-service",
		Redact:  redactor,
	}

	log := logger.NewLogger(options)

	// Dados sensíveis para redação
	sensitiveData := map[string]interface{}{
		"name":        "João Silva",
		"email":       "joao@example.com",
		"password":    "senha123",
		"cardNumber":  "1234 5678 9012 3456",
		"ssn":         "123-45-6789",
		"normalField": "valor normal",
	}

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		log.Info("Benchmark with redaction", map[string]interface{}{
			"iteration": i,
			"data":      sensitiveData,
		})
	}
}

// BenchmarkLoggerWithContext demonstra performance com contexto
func BenchmarkLoggerWithContext(b *testing.B) {
	// Configura logger
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "benchmark-service",
	}

	log := logger.NewLogger(options)

	// Cria contexto com correlation ID
	ctx := correlationContext.NewCorrelationContext("benchmark-cid")
	log = log.WithContext(ctx)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		log.Info("Benchmark with context", map[string]interface{}{
			"iteration": i,
		})
	}
}

// BenchmarkLoggerWithFields demonstra performance com campos
func BenchmarkLoggerWithFields(b *testing.B) {
	// Configura logger
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "benchmark-service",
	}

	log := logger.NewLogger(options)

	// Adiciona campos
	fields := map[string]interface{}{
		"userId":    123,
		"operation": "benchmark",
		"success":   true,
	}

	log = log.WithFields(fields)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		log.Info("Benchmark with fields", map[string]interface{}{
			"iteration": i,
		})
	}
}

// BenchmarkLoggerWithSink demonstra performance com sink customizado
func BenchmarkLoggerWithSink(b *testing.B) {
	// Mock sink para capturar logs
	var capturedLogs []types.LogEntry
	mockSink := &mockSink{logs: &capturedLogs}

	// Configura logger com sink
	options := types.LogOptions{
		Level:   types.InfoLevel,
		Service: "benchmark-service",
		Sink:    mockSink,
	}

	log := logger.NewLogger(options)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		log.Info("Benchmark with sink", map[string]interface{}{
			"iteration": i,
		})
	}
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

// Função principal para executar benchmarks
func main() {
	fmt.Println("=== Benchmarks do Go Logger ===")

	// Executa benchmarks
	fmt.Println("Executando benchmarks...")

	// Benchmark básico
	fmt.Println("1. Logger básico:")
	testing.Benchmark(BenchmarkLogger)

	fmt.Println("\n2. Logger com redação:")
	testing.Benchmark(BenchmarkLoggerWithRedaction)

	fmt.Println("\n3. Logger com contexto:")
	testing.Benchmark(BenchmarkLoggerWithContext)

	fmt.Println("\n4. Logger com campos:")
	testing.Benchmark(BenchmarkLoggerWithFields)

	fmt.Println("\n5. Logger com sink:")
	testing.Benchmark(BenchmarkLoggerWithSink)

	fmt.Println("=== Benchmarks concluídos ===")
}

// Exemplo de uso em produção
func ExampleProductionUsage() {
	// Configura logger para produção
	options := types.LogOptions{
		Level:       types.InfoLevel,
		Service:     "production-service",
		Environment: "production",
		Version:     "1.0.0",
		Redact: redactor.NewRedactor(redactor.RedactorOptions{
			Keys:     []string{"password", "cardNumber", "ssn", "cvv"},
			Patterns: []string{`\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b`},
			Mask:     "REDACTED",
			MaxDepth: 10,
		}),
		Fields: map[string]interface{}{
			"region": "us-east-1",
			"team":   "backend",
		},
	}

	log := logger.NewLogger(options)

	// Cria contexto com correlation ID
	ctx := correlationContext.NewCorrelationContext("prod-req-123")
	log = log.WithContext(ctx)

	// Log de exemplo
	log.Info("Operação de produção", map[string]interface{}{
		"operation": "user_creation",
		"duration":  "250ms",
		"userId":    "123",
		"success":   true,
	})
}
