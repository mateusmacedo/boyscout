package context

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// CorrelationIDHeader nome do header para correlation ID
const CorrelationIDHeader = "X-Correlation-ID"

// generateCorrelationID gera um novo correlation ID usando UUID padrão
func generateCorrelationID() string {
	return uuid.New().String()
}

// GenerateCorrelationID função pública para gerar correlation ID
func GenerateCorrelationID() string {
	return generateCorrelationID()
}

// WithCorrelationID adiciona um correlation ID ao contexto
func WithCorrelationID(ctx context.Context, correlationID string) context.Context {
	return context.WithValue(ctx, types.CorrelationIDKey, correlationID)
}

// GetCorrelationID extrai o correlation ID do contexto
func GetCorrelationID(ctx context.Context) string {
	if cid, ok := ctx.Value(types.CorrelationIDKey).(string); ok {
		return cid
	}
	return ""
}

// EnsureCorrelationID garante que existe um correlation ID no contexto
// Se não existir, gera um novo
func EnsureCorrelationID(ctx context.Context) (context.Context, string) {
	if cid := GetCorrelationID(ctx); cid != "" {
		return ctx, cid
	}

	cid := generateCorrelationID()
	return WithCorrelationID(ctx, cid), cid
}

// ExtractCorrelationIDFromRequest extrai correlation ID do header HTTP
func ExtractCorrelationIDFromRequest(r *http.Request) string {
	// Tenta extrair do header X-Correlation-ID
	if cid := r.Header.Get(CorrelationIDHeader); cid != "" {
		return strings.TrimSpace(cid)
	}

	// Fallback para outros headers comuns
	headers := []string{
		"X-Request-ID",
		"X-Trace-ID",
		"X-Transaction-ID",
	}

	for _, header := range headers {
		if cid := r.Header.Get(header); cid != "" {
			return strings.TrimSpace(cid)
		}
	}

	return ""
}

// SetCorrelationIDInResponse define o correlation ID no header de resposta
func SetCorrelationIDInResponse(w http.ResponseWriter, correlationID string) {
	w.Header().Set(CorrelationIDHeader, correlationID)
}

// MiddlewareCorrelationID cria um middleware para extrair/gerar correlation ID
func MiddlewareCorrelationID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extrai correlation ID do request
		cid := ExtractCorrelationIDFromRequest(r)

		// Se não existir, gera um novo
		if cid == "" {
			cid = generateCorrelationID()
		}

		// Adiciona ao contexto
		ctx := WithCorrelationID(r.Context(), cid)

		// Define no header de resposta
		SetCorrelationIDInResponse(w, cid)

		// Chama o próximo handler
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetCorrelationIDFromContext função de conveniência para obter correlation ID
func GetCorrelationIDFromContext(ctx context.Context) string {
	return GetCorrelationID(ctx)
}

// NewCorrelationContext cria um novo contexto com correlation ID
func NewCorrelationContext(correlationID string) context.Context {
	return WithCorrelationID(context.Background(), correlationID)
}
