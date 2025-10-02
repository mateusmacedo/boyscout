package main

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/mateusmacedo/boyscout/go-logger/internal/logger"
	echoLogger "github.com/mateusmacedo/boyscout/go-logger/pkg/echo"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// User representa um usuário
type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UserService simula um serviço de usuários
type UserService struct {
	logger types.Logger
}

// NewUserService cria um novo UserService
func NewUserService(logger types.Logger) *UserService {
	return &UserService{logger: logger}
}

// FindUserById busca um usuário por ID
func (s *UserService) FindUserById(id string) (*User, error) {
	s.logger.Info("Buscando usuário", map[string]interface{}{
		"userId": id,
	})

	// Simula usuário encontrado
	user := &User{
		ID:       id,
		Name:     "João Silva",
		Email:    "joao@example.com",
		Password: "senha123", // Será redatada
	}

	return user, nil
}

// CreateUser cria um novo usuário
func (s *UserService) CreateUser(userData *User) (*User, error) {
	s.logger.Info("Criando usuário", map[string]interface{}{
		"userData": userData,
	})

	// Simula usuário criado
	user := &User{
		ID:       "123",
		Name:     userData.Name,
		Email:    userData.Email,
		Password: "***", // Já redatada
	}

	return user, nil
}

func main() {
	// Configura logger
	options := types.DefaultLogOptions()
	options.Service = "user-api"
	options.Environment = "development"
	options.Version = "1.0.0"

	log := logger.NewLogger(options)

	// Cria Echo
	e := echo.New()

	// Aplica middlewares
	e.Use(echoLogger.CorrelationIDMiddleware())
	e.Use(echoLogger.LoggingMiddleware(log))
	e.Use(echoLogger.ErrorLoggingMiddleware(log))

	// Cria serviço
	userService := NewUserService(log)

	// Rotas
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":  "ok",
			"service": "user-api",
		})
	})

	e.GET("/users/:id", func(c echo.Context) error {
		id := c.Param("id")

		user, err := userService.FindUserById(id)
		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]interface{}{
				"error": "Usuário não encontrado",
			})
		}

		return c.JSON(http.StatusOK, user)
	})

	e.POST("/users", func(c echo.Context) error {
		var userData User
		if err := c.Bind(&userData); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]interface{}{
				"error": "Dados inválidos",
			})
		}

		user, err := userService.CreateUser(&userData)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]interface{}{
				"error": "Erro ao criar usuário",
			})
		}

		return c.JSON(http.StatusCreated, user)
	})

	// Inicia servidor
	log.Info("Servidor iniciado", map[string]interface{}{
		"port":    ":8080",
		"service": "user-api",
	})

	e.Logger.Fatal(e.Start(":8080"))
}
