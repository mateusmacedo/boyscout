package main

import (
	"context"
	"fmt"
	"time"

	correlationContext "github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/internal/logger"
	"github.com/mateusmacedo/boyscout/go-logger/internal/redactor"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// ElasticAPMSink demonstra integração com ElasticAPM
type ElasticAPMSink struct {
	serviceName string
	environment string
}

// NewElasticAPMSink cria um novo sink para ElasticAPM
func NewElasticAPMSink(serviceName, environment string) *ElasticAPMSink {
	return &ElasticAPMSink{
		serviceName: serviceName,
		environment: environment,
	}
}

// Write implementa a interface Sink para ElasticAPM
func (s *ElasticAPMSink) Write(entry types.LogEntry) error {
	// Em uma implementação real, aqui você enviaria para o ElasticAPM
	// Por exemplo, usando a biblioteca go-elasticsearch ou apm-go

	// Simula formatação ECS (Elastic Common Schema)
	ecsEntry := map[string]interface{}{
		"@timestamp": entry.Timestamp.Format(time.RFC3339),
		"log": map[string]interface{}{
			"level": string(entry.Level),
		},
		"service": map[string]interface{}{
			"name":    s.serviceName,
			"version": "1.0.0",
		},
		"ecs": map[string]interface{}{
			"version": "8.0.0",
		},
	}

	// Adiciona campos específicos do ECS
	if entry.CorrelationID != "" {
		ecsEntry["trace"] = map[string]interface{}{
			"id": entry.CorrelationID,
		}
	}

	if entry.Scope.ClassName != "" || entry.Scope.MethodName != "" {
		ecsEntry["code"] = map[string]interface{}{
			"file":     entry.Scope.ClassName,
			"function": entry.Scope.MethodName,
		}
	}

	if entry.DurationMs > 0 {
		ecsEntry["duration"] = map[string]interface{}{
			"us": int64(entry.DurationMs * 1000), // Converte para microssegundos
		}
	}

	if entry.Error != nil {
		ecsEntry["error"] = map[string]interface{}{
			"message": entry.Error.Message,
			"type":    entry.Error.Name,
		}
	}

	// Adiciona campos customizados
	if len(entry.Fields) > 0 {
		ecsEntry["custom"] = entry.Fields
	}

	// Simula envio para ElasticAPM
	fmt.Printf("ElasticAPM Event: %+v\n\n", ecsEntry)

	return nil
}

// Close implementa a interface Sink
func (s *ElasticAPMSink) Close() error {
	// Cleanup se necessário
	return nil
}

// OrderService demonstra um serviço com logging para ElasticAPM
type OrderService struct {
	logger types.Logger
}

// NewOrderService cria um novo OrderService
func NewOrderService(logger types.Logger) *OrderService {
	return &OrderService{logger: logger}
}

// ProcessOrder processa um pedido
func (s *OrderService) ProcessOrder(ctx context.Context, orderData map[string]interface{}) error {
	correlationID := correlationContext.GetCorrelationID(ctx)

	s.logger.Info("Iniciando processamento do pedido", map[string]interface{}{
		"correlationId": correlationID,
		"orderId":       orderData["id"],
		"customerId":    orderData["customerId"],
		"amount":        orderData["amount"],
	})

	// Simula validação
	if err := s.validateOrder(orderData); err != nil {
		s.logger.Error("Falha na validação do pedido", map[string]interface{}{
			"correlationId": correlationID,
			"orderId":       orderData["id"],
			"error":         err.Error(),
		})
		return err
	}

	// Simula processamento
	time.Sleep(100 * time.Millisecond)

	// Simula falha ocasional
	if orderData["amount"].(float64) > 10000 {
		err := fmt.Errorf("valor muito alto para processamento automático")
		s.logger.Error("Falha no processamento do pedido", map[string]interface{}{
			"correlationId": correlationID,
			"orderId":       orderData["id"],
			"error":         err.Error(),
		})
		return err
	}

	s.logger.Info("Pedido processado com sucesso", map[string]interface{}{
		"correlationId": correlationID,
		"orderId":       orderData["id"],
		"duration":      "150ms",
		"status":        "completed",
	})

	return nil
}

// validateOrder valida dados do pedido
func (s *OrderService) validateOrder(orderData map[string]interface{}) error {
	s.logger.Debug("Validando dados do pedido")

	if orderData["id"] == nil {
		return fmt.Errorf("ID do pedido é obrigatório")
	}

	if orderData["customerId"] == nil {
		return fmt.Errorf("ID do cliente é obrigatório")
	}

	if orderData["amount"] == nil {
		return fmt.Errorf("valor é obrigatório")
	}

	return nil
}

func main() {
	fmt.Println("=== Exemplo de Integração com ElasticAPM ===")

	// Cria sink para ElasticAPM
	elasticSink := NewElasticAPMSink("order-service", "production")

	// Configura redator para dados sensíveis
	redactor := redactor.NewRedactor(redactor.RedactorOptions{
		Keys:     []string{"password", "cardNumber", "ssn", "cvv"},
		Patterns: []string{`\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b`},
		Mask:     "REDACTED",
		MaxDepth: 10,
	})

	// Configura logger com sink do ElasticAPM
	options := types.LogOptions{
		Level:       types.InfoLevel,
		Service:     "order-service",
		Environment: "production",
		Version:     "1.0.0",
		Redact:      redactor,
		Sink:        elasticSink,
		Fields: map[string]interface{}{
			"region":     "us-east-1",
			"datacenter": "dc1",
			"team":       "orders",
		},
	}

	log := logger.NewLogger(options)

	// Cria contexto com correlation ID
	ctx := correlationContext.NewCorrelationContext("order-req-123")
	log = log.WithContext(ctx)

	// Cria serviço
	orderService := NewOrderService(log)

	// Demonstra processamento de pedidos
	fmt.Println("1. Processando pedido válido...")
	orderData := map[string]interface{}{
		"id":         "order-123",
		"customerId": "customer-456",
		"amount":     float64(150.50),
		"cardNumber": "1234 5678 9012 3456",
		"items": []map[string]interface{}{
			{"name": "Produto A", "price": 75.25},
			{"name": "Produto B", "price": 75.25},
		},
	}

	err := orderService.ProcessOrder(ctx, orderData)
	if err != nil {
		fmt.Printf("Erro: %v\n", err)
	}

	fmt.Println()

	// Demonstra pedido com valor alto
	fmt.Println("2. Processando pedido com valor alto...")
	highValueOrder := map[string]interface{}{
		"id":         "order-124",
		"customerId": "customer-789",
		"amount":     float64(15000.00),
		"cardNumber": "9876 5432 1098 7654",
	}

	err = orderService.ProcessOrder(ctx, highValueOrder)
	if err != nil {
		fmt.Printf("Erro: %v\n", err)
	}

	fmt.Println()

	// Demonstra pedido inválido
	fmt.Println("3. Processando pedido inválido...")
	invalidOrder := map[string]interface{}{
		"id":     "order-125",
		"amount": float64(50.00),
		// customerId ausente
	}

	err = orderService.ProcessOrder(ctx, invalidOrder)
	if err != nil {
		fmt.Printf("Erro: %v\n", err)
	}

	fmt.Println()

	// Demonstra diferentes níveis de log
	fmt.Println("4. Diferentes níveis de log...")

	log.Trace("Operação de trace - muito detalhada")
	log.Debug("Operação de debug - informações de desenvolvimento")
	log.Info("Operação de info - informações gerais")
	log.Warn("Operação de warning - algo que merece atenção")
	log.Error("Operação de error - erro que não impede execução")

	fmt.Println()

	// Demonstra métricas de performance
	fmt.Println("5. Métricas de performance...")

	log.Info("Métricas do sistema", map[string]interface{}{
		"cpu_usage":     "65%",
		"memory_usage":  "1.2GB",
		"disk_usage":    "45%",
		"network_io":    "2.5MB/s",
		"active_orders": 1250,
		"queue_size":    45,
	})

	log.Info("Métricas de banco de dados", map[string]interface{}{
		"connection_pool": "85%",
		"query_time":      "12ms",
		"cache_hit_rate":  "94%",
		"slow_queries":    3,
	})

	fmt.Println("=== Exemplo concluído ===")
}
