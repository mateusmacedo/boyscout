package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/mateusmacedo/boyscout/go-logger/internal/logger"
	ginLogger "github.com/mateusmacedo/boyscout/go-logger/pkg/gin"
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

	// Configura Gin
	gin.SetMode(gin.DebugMode)
	r := gin.New()

	// Aplica middlewares
	r.Use(ginLogger.CorrelationIDMiddleware())
	r.Use(ginLogger.LoggingMiddleware(log))
	r.Use(ginLogger.ErrorLoggingMiddleware(log))
	r.Use(gin.Recovery())

	// Cria serviço
	userService := NewUserService(log)

	// Rotas
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "user-api",
		})
	})

	r.GET("/users/:id", func(c *gin.Context) {
		id := c.Param("id")

		user, err := userService.FindUserById(id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Usuário não encontrado",
			})
			return
		}

		c.JSON(http.StatusOK, user)
	})

	r.POST("/users", func(c *gin.Context) {
		var userData User
		if err := c.ShouldBindJSON(&userData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Dados inválidos",
			})
			return
		}

		user, err := userService.CreateUser(&userData)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erro ao criar usuário",
			})
			return
		}

		c.JSON(http.StatusCreated, user)
	})

	// Inicia servidor
	log.Info("Servidor iniciado", map[string]interface{}{
		"port":    ":8080",
		"service": "user-api",
	})

	r.Run(":8080")
}
