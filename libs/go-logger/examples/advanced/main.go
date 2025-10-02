package main

import (
	"context"
	"fmt"
	"time"

	correlationContext "github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/internal/decorators"
	"github.com/mateusmacedo/boyscout/go-logger/internal/logger"
	"github.com/mateusmacedo/boyscout/go-logger/internal/redactor"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// UserService demonstra uso avançado do logger
type UserService struct {
	logger types.Logger
}

// NewUserService cria um novo UserService
func NewUserService(logger types.Logger) *UserService {
	return &UserService{logger: logger}
}

// CreateUser demonstra logging com contexto e correlação
func (s *UserService) CreateUser(ctx context.Context, userData map[string]interface{}) (map[string]interface{}, error) {
	// Obtém correlation ID do contexto
	correlationID := correlationContext.GetCorrelationID(ctx)

	s.logger.Info("Iniciando criação de usuário", map[string]interface{}{
		"correlationId": correlationID,
		"userData":      userData,
	})

	// Simula validação
	if err := s.validateUser(userData); err != nil {
		s.logger.Error("Falha na validação do usuário", map[string]interface{}{
			"correlationId": correlationID,
			"error":         err.Error(),
		})
		return nil, err
	}

	// Simula criação
	user := map[string]interface{}{
		"id":        "user-123",
		"name":      userData["name"],
		"email":     userData["email"],
		"createdAt": time.Now(),
	}

	s.logger.Info("Usuário criado com sucesso", map[string]interface{}{
		"correlationId": correlationID,
		"userId":        user["id"],
		"duration":      "150ms",
	})

	return user, nil
}

// validateUser demonstra logging de validação
func (s *UserService) validateUser(userData map[string]interface{}) error {
	s.logger.Debug("Validando dados do usuário")

	// Simula validação
	if name, ok := userData["name"].(string); !ok || name == "" {
		return fmt.Errorf("nome é obrigatório")
	}

	if email, ok := userData["email"].(string); !ok || email == "" {
		return fmt.Errorf("email é obrigatório")
	}

	return nil
}

// ProcessPayment demonstra uso de decorators
func ProcessPayment(amount float64, cardNumber string) (string, error) {
	// Simula processamento
	time.Sleep(100 * time.Millisecond)

	if amount <= 0 {
		return "", fmt.Errorf("valor inválido")
	}

	// Simula falha ocasional
	if amount > 1000 {
		return "", fmt.Errorf("valor muito alto")
	}

	return fmt.Sprintf("payment-%d", time.Now().Unix()), nil
}

// SendEmail demonstra logging de operações externas
func SendEmail(to, subject, body string) error {
	// Simula envio de email
	time.Sleep(50 * time.Millisecond)

	fmt.Printf("Email enviado para %s: %s\n", to, subject)
	return nil
}

func main() {
	fmt.Println("=== Exemplo Avançado do Go Logger ===")

	// Configura redator customizado
	customRedactor := redactor.NewRedactor(redactor.RedactorOptions{
		Keys:     []string{"password", "cardNumber", "ssn"},
		Patterns: []string{`\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b`}, // Números de cartão
		Mask:     "REDACTED",
		MaxDepth: 10,
	})

	// Configura logger com redator customizado
	options := types.LogOptions{
		Level:       types.InfoLevel,
		Service:     "user-service",
		Environment: "production",
		Version:     "2.0.0",
		Redact:      customRedactor,
		Fields: map[string]interface{}{
			"region": "us-east-1",
			"team":   "backend",
		},
	}

	log := logger.NewLogger(options)

	// Cria contexto com correlation ID
	ctx := correlationContext.NewCorrelationContext("req-advanced-123")
	log = log.WithContext(ctx)

	// Cria serviço
	userService := NewUserService(log)

	// Demonstra criação de usuário
	fmt.Println("1. Criando usuário...")
	userData := map[string]interface{}{
		"name":       "João Silva",
		"email":      "joao@example.com",
		"password":   "senha123",
		"cardNumber": "1234 5678 9012 3456",
	}

	user, err := userService.CreateUser(ctx, userData)
	if err != nil {
		log.Error("Falha ao criar usuário", map[string]interface{}{
			"error": err.Error(),
		})
	} else {
		log.Info("Usuário criado", map[string]interface{}{
			"userId": user["id"],
		})
	}

	fmt.Println()

	// Demonstra decorator com logging automático
	fmt.Println("2. Processando pagamento com decorator...")

	// Configura decorator para logging automático
	decoratorOptions := decorators.LogMethodOptions{
		Level:         types.InfoLevel,
		IncludeArgs:   true,
		IncludeResult: true,
		SampleRate:    1.0,
		Redact:        customRedactor,
		GetCorrelationID: func() string {
			return correlationContext.GetCorrelationID(ctx)
		},
	}

	// Aplica decorator
	decoratedProcessPayment := decorators.LogMethod(decoratorOptions)(ProcessPayment)

	// Testa pagamento válido
	paymentID, err := decoratedProcessPayment.(func(float64, string) (string, error))(50.0, "1234 5678 9012 3456")
	if err != nil {
		log.Error("Falha no pagamento", map[string]interface{}{
			"error": err.Error(),
		})
	} else {
		log.Info("Pagamento processado", map[string]interface{}{
			"paymentId": paymentID,
		})
	}

	// Testa pagamento inválido
	_, err = decoratedProcessPayment.(func(float64, string) (string, error))(1500.0, "1234 5678 9012 3456")
	if err != nil {
		log.Error("Falha no pagamento", map[string]interface{}{
			"error": err.Error(),
		})
	}

	fmt.Println()

	// Demonstra logging de operações externas
	fmt.Println("3. Enviando email...")

	emailErr := SendEmail("joao@example.com", "Bem-vindo!", "Seu usuário foi criado com sucesso!")
	if emailErr != nil {
		log.Error("Falha ao enviar email", map[string]interface{}{
			"error": emailErr.Error(),
		})
	} else {
		log.Info("Email enviado com sucesso", map[string]interface{}{
			"to":      "joao@example.com",
			"subject": "Bem-vindo!",
		})
	}

	fmt.Println()

	// Demonstra diferentes níveis de log
	fmt.Println("4. Diferentes níveis de log...")

	log.Trace("Mensagem de trace - muito detalhada")
	log.Debug("Mensagem de debug - informações de desenvolvimento")
	log.Info("Mensagem de info - informações gerais")
	log.Warn("Mensagem de warning - algo que merece atenção")
	log.Error("Mensagem de error - erro que não impede execução")

	fmt.Println()

	// Demonstra logging com campos estruturados
	fmt.Println("5. Logging com campos estruturados...")

	log.Info("Operação de banco de dados", map[string]interface{}{
		"operation": "SELECT",
		"table":     "users",
		"duration":  "45ms",
		"rows":      150,
		"cache":     "miss",
	})

	log.Info("Métricas de performance", map[string]interface{}{
		"cpu_usage":    "75%",
		"memory_usage": "512MB",
		"disk_usage":   "2.1GB",
		"network_io":   "1.2MB/s",
		"active_users": 1250,
	})

	fmt.Println("\n=== Exemplo concluído ===")
}
