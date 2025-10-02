package gin

import (
	"time"

	"github.com/gin-gonic/gin"

	"github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// LoggingMiddleware cria um middleware de logging para Gin
func LoggingMiddleware(log types.Logger) gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Extrai correlation ID do contexto
		cid := context.GetCorrelationID(param.Request.Context())

		// Cria campos para o log
		fields := map[string]interface{}{
			"method":    param.Method,
			"path":      param.Path,
			"status":    param.StatusCode,
			"latency":   param.Latency,
			"clientIP":  param.ClientIP,
			"userAgent": param.Request.UserAgent(),
			"timestamp": param.TimeStamp.Format(time.RFC3339),
		}

		if cid != "" {
			fields["correlationId"] = cid
		}

		// Loga a requisição
		log.Info("HTTP Request", fields)

		return ""
	})
}

// CorrelationIDMiddleware cria um middleware para correlation ID
func CorrelationIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extrai ou gera correlation ID
		cid := context.ExtractCorrelationIDFromRequest(c.Request)
		if cid == "" {
			cid = generateCorrelationID()
		}

		// Adiciona ao contexto
		ctx := context.WithCorrelationID(c.Request.Context(), cid)
		c.Request = c.Request.WithContext(ctx)

		// Define no header de resposta
		c.Header("X-Correlation-ID", cid)

		c.Next()
	}
}

// ErrorLoggingMiddleware cria um middleware para logging de erros
func ErrorLoggingMiddleware(log types.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Verifica se houve erro
		if len(c.Errors) > 0 {
			cid := context.GetCorrelationID(c.Request.Context())

			fields := map[string]interface{}{
				"method":    c.Request.Method,
				"path":      c.Request.URL.Path,
				"status":    c.Writer.Status(),
				"clientIP":  c.ClientIP(),
				"userAgent": c.Request.UserAgent(),
			}

			if cid != "" {
				fields["correlationId"] = cid
			}

			// Loga cada erro
			for _, err := range c.Errors {
				errorFields := make(map[string]interface{})
				for k, v := range fields {
					errorFields[k] = v
				}
				errorFields["error"] = err.Error()

				log.Error("HTTP Error", errorFields)
			}
		}
	}
}

// RequestLoggingMiddleware cria um middleware completo de logging
func RequestLoggingMiddleware(log types.Logger) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Inicia medição de tempo
		start := time.Now()

		// Extrai correlation ID
		cid := context.ExtractCorrelationIDFromRequest(c.Request)
		if cid == "" {
			cid = generateCorrelationID()
		}

		// Adiciona ao contexto
		ctx := context.WithCorrelationID(c.Request.Context(), cid)
		c.Request = c.Request.WithContext(ctx)

		// Define no header de resposta
		c.Header("X-Correlation-ID", cid)

		// Loga início da requisição
		fields := map[string]interface{}{
			"method":        c.Request.Method,
			"path":          c.Request.URL.Path,
			"query":         c.Request.URL.RawQuery,
			"clientIP":      c.ClientIP(),
			"userAgent":     c.Request.UserAgent(),
			"correlationId": cid,
		}

		log.Info("HTTP Request Started", fields)

		// Processa a requisição
		c.Next()

		// Calcula duração
		duration := time.Since(start)

		// Loga fim da requisição
		responseFields := map[string]interface{}{
			"method":        c.Request.Method,
			"path":          c.Request.URL.Path,
			"status":        c.Writer.Status(),
			"duration":      duration,
			"clientIP":      c.ClientIP(),
			"userAgent":     c.Request.UserAgent(),
			"correlationId": cid,
		}

		// Adiciona informações de erro se houver
		if len(c.Errors) > 0 {
			responseFields["errors"] = c.Errors.String()
		}

		log.Info("HTTP Request Completed", responseFields)
	})
}

// generateCorrelationID gera um novo correlation ID
func generateCorrelationID() string {
	return context.GenerateCorrelationID()
}

// SetupGinLogger configura o logger global do Gin
func SetupGinLogger(log types.Logger) {
	// Configura o modo do Gin baseado no ambiente
	// Em produção, você pode configurar o modo aqui
	gin.SetMode(gin.DebugMode)
}
