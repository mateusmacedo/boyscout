package echo

import (
	"time"

	"github.com/labstack/echo/v4"

	"github.com/mateusmacedo/boyscout/go-logger/internal/context"
	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// LoggingMiddleware cria um middleware de logging para Echo
func LoggingMiddleware(log types.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Inicia medição de tempo
			start := time.Now()

			// Extrai correlation ID
			cid := context.ExtractCorrelationIDFromRequest(c.Request())
			if cid == "" {
				cid = generateCorrelationID()
			}

			// Adiciona ao contexto
			ctx := context.WithCorrelationID(c.Request().Context(), cid)
			c.SetRequest(c.Request().WithContext(ctx))

			// Define no header de resposta
			c.Response().Header().Set("X-Correlation-ID", cid)

			// Loga início da requisição
			fields := map[string]interface{}{
				"method":        c.Request().Method,
				"path":          c.Request().URL.Path,
				"query":         c.Request().URL.RawQuery,
				"clientIP":      c.RealIP(),
				"userAgent":     c.Request().UserAgent(),
				"correlationId": cid,
			}

			log.Info("HTTP Request Started", fields)

			// Processa a requisição
			err := next(c)

			// Calcula duração
			duration := time.Since(start)

			// Loga fim da requisição
			responseFields := map[string]interface{}{
				"method":        c.Request().Method,
				"path":          c.Request().URL.Path,
				"status":        c.Response().Status,
				"duration":      duration,
				"clientIP":      c.RealIP(),
				"userAgent":     c.Request().UserAgent(),
				"correlationId": cid,
			}

			// Adiciona informações de erro se houver
			if err != nil {
				responseFields["error"] = err.Error()
				log.Error("HTTP Request Error", responseFields)
			} else {
				log.Info("HTTP Request Completed", responseFields)
			}

			return err
		}
	}
}

// CorrelationIDMiddleware cria um middleware para correlation ID
func CorrelationIDMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Extrai ou gera correlation ID
			cid := context.ExtractCorrelationIDFromRequest(c.Request())
			if cid == "" {
				cid = generateCorrelationID()
			}

			// Adiciona ao contexto
			ctx := context.WithCorrelationID(c.Request().Context(), cid)
			c.SetRequest(c.Request().WithContext(ctx))

			// Define no header de resposta
			c.Response().Header().Set("X-Correlation-ID", cid)

			return next(c)
		}
	}
}

// ErrorLoggingMiddleware cria um middleware para logging de erros
func ErrorLoggingMiddleware(log types.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)

			if err != nil {
				cid := context.GetCorrelationID(c.Request().Context())

				fields := map[string]interface{}{
					"method":    c.Request().Method,
					"path":      c.Request().URL.Path,
					"status":    c.Response().Status,
					"clientIP":  c.RealIP(),
					"userAgent": c.Request().UserAgent(),
					"error":     err.Error(),
				}

				if cid != "" {
					fields["correlationId"] = cid
				}

				log.Error("HTTP Error", fields)
			}

			return err
		}
	}
}

// RequestLoggingMiddleware cria um middleware completo de logging
func RequestLoggingMiddleware(log types.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Inicia medição de tempo
			start := time.Now()

			// Extrai correlation ID
			cid := context.ExtractCorrelationIDFromRequest(c.Request())
			if cid == "" {
				cid = generateCorrelationID()
			}

			// Adiciona ao contexto
			ctx := context.WithCorrelationID(c.Request().Context(), cid)
			c.SetRequest(c.Request().WithContext(ctx))

			// Define no header de resposta
			c.Response().Header().Set("X-Correlation-ID", cid)

			// Loga início da requisição
			fields := map[string]interface{}{
				"method":        c.Request().Method,
				"path":          c.Request().URL.Path,
				"query":         c.Request().URL.RawQuery,
				"clientIP":      c.RealIP(),
				"userAgent":     c.Request().UserAgent(),
				"correlationId": cid,
			}

			log.Info("HTTP Request Started", fields)

			// Processa a requisição
			err := next(c)

			// Calcula duração
			duration := time.Since(start)

			// Loga fim da requisição
			responseFields := map[string]interface{}{
				"method":        c.Request().Method,
				"path":          c.Request().URL.Path,
				"status":        c.Response().Status,
				"duration":      duration,
				"clientIP":      c.RealIP(),
				"userAgent":     c.Request().UserAgent(),
				"correlationId": cid,
			}

			// Adiciona informações de erro se houver
			if err != nil {
				responseFields["error"] = err.Error()
				log.Error("HTTP Request Error", responseFields)
			} else {
				log.Info("HTTP Request Completed", responseFields)
			}

			return err
		}
	}
}

// generateCorrelationID gera um novo correlation ID
func generateCorrelationID() string {
	return context.GenerateCorrelationID()
}

// SetupEchoLogger configura o logger global do Echo
func SetupEchoLogger(log types.Logger) {
	// Configura o modo do Echo baseado no ambiente
	// Em produção, você pode configurar o modo aqui
}
