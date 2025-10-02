package main

import (
	"fmt"
	"time"

	correlationContext "github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/internal/decorators"
	"github.com/mateusmacedo/boyscout/go-logger/internal/logger"
	"github.com/mateusmacedo/boyscout/go-logger/internal/redactor"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// UserService exemplo de serviço com logging
type UserService struct {
	logger types.Logger
}

// NewUserService cria um novo UserService
func NewUserService(logger types.Logger) *UserService {
	return &UserService{logger: logger}
}

// FindUserById simula busca de usuário
func (s *UserService) FindUserById(id string) (*User, error) {
	s.logger.Info("Buscando usuário", map[string]interface{}{
		"userId": id,
	})

	// Simula delay
	time.Sleep(100 * time.Millisecond)

	// Simula usuário encontrado
	user := &User{
		ID:       id,
		Name:     "João Silva",
		Email:    "joao@example.com",
		Password: "senha123", // Será redatada
	}

	s.logger.Info("Usuário encontrado", map[string]interface{}{
		"userId": id,
		"user":   user,
	})

	return user, nil
}

// CreateUser simula criação de usuário
func (s *UserService) CreateUser(userData *User) (*User, error) {
	s.logger.Info("Criando usuário", map[string]interface{}{
		"userData": userData,
	})

	// Simula delay
	time.Sleep(200 * time.Millisecond)

	// Simula usuário criado
	user := &User{
		ID:       "123",
		Name:     userData.Name,
		Email:    userData.Email,
		Password: "***", // Já redatada
	}

	s.logger.Info("Usuário criado", map[string]interface{}{
		"user": user,
	})

	return user, nil
}

// User representa um usuário
type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// ProcessPayment exemplo de função com decorator
func ProcessPayment(amount float64, cardNumber string) error {
	// Simula processamento
	time.Sleep(150 * time.Millisecond)

	// Simula sucesso
	return nil
}

// ProcessPaymentWithError exemplo de função que pode falhar
func ProcessPaymentWithError(amount float64, cardNumber string) error {
	// Simula processamento
	time.Sleep(100 * time.Millisecond)

	// Simula erro
	return fmt.Errorf("cartão recusado")
}

func main() {
	// Configura logger
	options := types.DefaultLogOptions()
	options.Service = "user-service"
	options.Environment = "development"
	options.Version = "1.0.0"
	options.Redact = redactor.DefaultRedactor()

	log := logger.NewLogger(options)

	// Cria contexto com correlation ID
	ctx := correlationContext.NewCorrelationContext("req-123-456")
	log = log.WithContext(ctx)

	// Cria serviço
	userService := NewUserService(log)

	// Exemplo 1: Busca de usuário
	fmt.Println("=== Exemplo 1: Busca de usuário ===")
	user, err := userService.FindUserById("123")
	if err != nil {
		log.Error("Erro ao buscar usuário", map[string]interface{}{
			"error": err.Error(),
		})
	} else {
		log.Info("Usuário encontrado", map[string]interface{}{
			"user": user,
		})
	}

	// Exemplo 2: Criação de usuário com dados sensíveis
	fmt.Println("\n=== Exemplo 2: Criação de usuário ===")
	userData := &User{
		Name:     "Maria Santos",
		Email:    "maria@example.com",
		Password: "senha123",
	}

	createdUser, err := userService.CreateUser(userData)
	if err != nil {
		log.Error("Erro ao criar usuário", map[string]interface{}{
			"error": err.Error(),
		})
	} else {
		log.Info("Usuário criado", map[string]interface{}{
			"user": createdUser,
		})
	}

	// Exemplo 3: Decorator de método
	fmt.Println("\n=== Exemplo 3: Decorator de método ===")

	// Configura opções do decorator
	decoratorOptions := decorators.LogMethodOptions{
		Level:         types.InfoLevel,
		IncludeArgs:   true,
		IncludeResult: false,
		SampleRate:    1.0,
		Redact:        redactor.DefaultRedactor(),
		GetCorrelationID: func() string {
			return correlationContext.GetCorrelationID(ctx)
		},
	}

	// Aplica decorator
	decoratedProcessPayment := decorators.LogMethod(decoratorOptions)(ProcessPayment)

	// Chama função decorada
	err = decoratedProcessPayment.(func(float64, string) error)(100.50, "1234-5678-9012-3456")
	if err != nil {
		log.Error("Erro no pagamento", map[string]interface{}{
			"error": err.Error(),
		})
	}

	// Exemplo 4: Decorator de método com erro
	fmt.Println("\n=== Exemplo 4: Decorator de método com erro ===")

	errorDecoratorOptions := decoratorOptions
	errorDecoratorOptions.Level = types.ErrorLevel
	errorDecoratorOptions.IncludeResult = true

	decoratedProcessPaymentWithError := decorators.LogMethodError(errorDecoratorOptions)(ProcessPaymentWithError)

	// Chama função decorada (que vai falhar)
	err = decoratedProcessPaymentWithError.(func(float64, string) error)(200.75, "9876-5432-1098-7654")
	if err != nil {
		log.Error("Erro no pagamento", map[string]interface{}{
			"error": err.Error(),
		})
	}

	// Exemplo 5: Diferentes níveis de log
	fmt.Println("\n=== Exemplo 5: Diferentes níveis de log ===")
	log.Trace("Mensagem de trace")
	log.Debug("Mensagem de debug")
	log.Info("Mensagem de info")
	log.Warn("Mensagem de warning")
	log.Error("Mensagem de error")

	// Exemplo 6: Campos estruturados
	fmt.Println("\n=== Exemplo 6: Campos estruturados ===")
	log.Info("Operação concluída", map[string]interface{}{
		"operation": "user_creation",
		"duration":  "250ms",
		"userId":    "123",
		"success":   true,
	})

	fmt.Println("\n=== Exemplos concluídos ===")
}
