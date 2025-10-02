package main

import (
	"fmt"
	"time"

	gologger "github.com/mateusmacedo/boyscout/go-logger/pkg"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

func Hello(name string) string {
	result := "Hello " + name
	return result
}

func main() {
	// Configura logger
	options := types.LogOptions{
		Level:       types.InfoLevel,
		Service:     "go-api",
		Environment: "development",
		Version:     "1.0.0",
		Fields: map[string]interface{}{
			"app": "go-api",
		},
	}

	log := gologger.NewLogger(options)

	// Log de inicialização
	log.Info("Aplicação Go API iniciada", map[string]interface{}{
		"timestamp": time.Now(),
		"version":   "1.0.0",
	})

	// Executa função Hello com logging
	log.Info("Executando função Hello")
	result := Hello("go-api")

	log.Info("Função Hello executada com sucesso", map[string]interface{}{
		"result": result,
	})

	fmt.Println(result)

	// Log de finalização
	log.Info("Aplicação Go API finalizada")
}
