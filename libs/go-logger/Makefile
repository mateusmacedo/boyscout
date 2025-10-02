# Makefile para boyscout/go-logger

.PHONY: help build test test-coverage lint clean deps fmt vet

# Variáveis
BINARY_NAME=go-logger
VERSION?=1.0.0
BUILD_TIME=$(shell date +%Y-%m-%dT%H:%M:%S%z)
GIT_COMMIT=$(shell git rev-parse --short HEAD)
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -X main.GitCommit=$(GIT_COMMIT)"

# Cores para output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[0;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

help: ## Mostra esta ajuda
	@echo "$(BLUE)boyscout/go-logger - Biblioteca de Logging Estruturado$(NC)"
	@echo ""
	@echo "$(YELLOW)Comandos disponíveis:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

deps: ## Instala dependências
	@echo "$(BLUE)Instalando dependências...$(NC)"
	go mod download
	go mod tidy

fmt: ## Formata o código
	@echo "$(BLUE)Formatando código...$(NC)"
	go fmt ./...

vet: ## Executa go vet
	@echo "$(BLUE)Executando go vet...$(NC)"
	go vet ./...

lint: ## Executa linter
	@echo "$(BLUE)Executando linter...$(NC)"
	golangci-lint run

test: ## Executa testes
	@echo "$(BLUE)Executando testes...$(NC)"
	go test -v ./...

test-coverage: ## Executa testes com cobertura
	@echo "$(BLUE)Executando testes com cobertura...$(NC)"
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "$(GREEN)Cobertura salva em coverage.html$(NC)"

build: ## Compila o projeto
	@echo "$(BLUE)Compilando projeto...$(NC)"
	go build $(LDFLAGS) -o bin/$(BINARY_NAME) ./cmd/example

build-all: ## Compila para múltiplas plataformas
	@echo "$(BLUE)Compilando para múltiplas plataformas...$(NC)"
	@mkdir -p bin
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-linux-amd64 ./cmd/example
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-windows-amd64.exe ./cmd/example
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-darwin-amd64 ./cmd/example

clean: ## Limpa arquivos gerados
	@echo "$(BLUE)Limpando arquivos gerados...$(NC)"
	rm -rf bin/
	rm -f coverage.out coverage.html

benchmark: ## Executa benchmarks
	@echo "$(BLUE)Executando benchmarks...$(NC)"
	go test -bench=. -benchmem ./...

install-tools: ## Instala ferramentas de desenvolvimento
	@echo "$(BLUE)Instalando ferramentas de desenvolvimento...$(NC)"
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install golang.org/x/tools/cmd/goimports@latest

dev: fmt vet test ## Executa pipeline de desenvolvimento

ci: deps fmt vet lint test test-coverage ## Pipeline de CI/CD

# Comandos específicos para nx
nx-test: test ## Comando para nx test
nx-lint: lint ## Comando para nx lint
