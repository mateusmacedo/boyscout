package context

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateCorrelationID(t *testing.T) {
	cid := GenerateCorrelationID()

	// Verifica se é um UUID válido (36 caracteres com hífens)
	assert.Len(t, cid, 36)
	assert.Contains(t, cid, "-")

	// Gera outro ID para verificar se são diferentes
	cid2 := GenerateCorrelationID()
	assert.NotEqual(t, cid, cid2)
}

func TestWithCorrelationID(t *testing.T) {
	ctx := context.Background()
	cid := "test-correlation-id"

	ctxWithCID := WithCorrelationID(ctx, cid)
	assert.NotNil(t, ctxWithCID)

	// Verifica se o correlation ID foi adicionado
	retrievedCID := GetCorrelationID(ctxWithCID)
	assert.Equal(t, cid, retrievedCID)
}

func TestGetCorrelationID(t *testing.T) {
	ctx := context.Background()

	// Contexto sem correlation ID deve retornar string vazia
	cid := GetCorrelationID(ctx)
	assert.Empty(t, cid)

	// Contexto com correlation ID
	ctxWithCID := WithCorrelationID(ctx, "test-id")
	cid = GetCorrelationID(ctxWithCID)
	assert.Equal(t, "test-id", cid)
}

func TestEnsureCorrelationID(t *testing.T) {
	ctx := context.Background()

	// Contexto sem correlation ID deve gerar um novo
	ctxWithCID, cid := EnsureCorrelationID(ctx)
	assert.NotEmpty(t, cid)
	assert.Len(t, cid, 36) // UUID
	assert.Equal(t, cid, GetCorrelationID(ctxWithCID))

	// Contexto com correlation ID existente deve retornar o mesmo
	existingCID := "existing-id"
	ctxExisting := WithCorrelationID(ctx, existingCID)
	ctxResult, cidResult := EnsureCorrelationID(ctxExisting)
	assert.Equal(t, existingCID, cidResult)
	assert.Equal(t, ctxExisting, ctxResult)
}

func TestExtractCorrelationIDFromRequest(t *testing.T) {
	req := &http.Request{
		Header: make(http.Header),
	}

	// Sem header deve retornar string vazia
	cid := ExtractCorrelationIDFromRequest(req)
	assert.Empty(t, cid)

	// Com header X-Correlation-ID
	req.Header.Set("X-Correlation-ID", "test-cid")
	cid = ExtractCorrelationIDFromRequest(req)
	assert.Equal(t, "test-cid", cid)

	// Com header X-Request-ID (fallback)
	req.Header.Del("X-Correlation-ID")
	req.Header.Set("X-Request-ID", "request-id")
	cid = ExtractCorrelationIDFromRequest(req)
	assert.Equal(t, "request-id", cid)

	// Com header X-Trace-ID (fallback)
	req.Header.Del("X-Request-ID")
	req.Header.Set("X-Trace-ID", "trace-id")
	cid = ExtractCorrelationIDFromRequest(req)
	assert.Equal(t, "trace-id", cid)

	// Com header X-Transaction-ID (fallback)
	req.Header.Del("X-Trace-ID")
	req.Header.Set("X-Transaction-ID", "transaction-id")
	cid = ExtractCorrelationIDFromRequest(req)
	assert.Equal(t, "transaction-id", cid)

	// Com espaços em branco deve ser trimado
	req.Header.Set("X-Correlation-ID", "  spaced-cid  ")
	cid = ExtractCorrelationIDFromRequest(req)
	assert.Equal(t, "spaced-cid", cid)
}

func TestSetCorrelationIDInResponse(t *testing.T) {
	// Mock response writer
	response := &mockResponseWriter{}

	cid := "test-correlation-id"
	SetCorrelationIDInResponse(response, cid)

	// Verifica se o header foi definido
	headers := response.Header()
	assert.Equal(t, cid, headers.Get("X-Correlation-ID"))
}

func TestNewCorrelationContext(t *testing.T) {
	cid := "new-correlation-id"
	ctx := NewCorrelationContext(cid)

	assert.NotNil(t, ctx)
	assert.Equal(t, cid, GetCorrelationID(ctx))
}

func TestGetCorrelationIDFromContext(t *testing.T) {
	ctx := context.Background()

	// Contexto sem correlation ID
	cid := GetCorrelationIDFromContext(ctx)
	assert.Empty(t, cid)

	// Contexto com correlation ID
	ctxWithCID := WithCorrelationID(ctx, "test-id")
	cid = GetCorrelationIDFromContext(ctxWithCID)
	assert.Equal(t, "test-id", cid)
}

// Mock response writer para testes
type mockResponseWriter struct {
	headers http.Header
}

func (m *mockResponseWriter) Header() http.Header {
	if m.headers == nil {
		m.headers = make(http.Header)
	}
	return m.headers
}

func (m *mockResponseWriter) Write([]byte) (int, error) {
	return 0, nil
}

func (m *mockResponseWriter) WriteHeader(statusCode int) {}

func TestMiddlewareCorrelationID(t *testing.T) {
	// Mock request
	req := &http.Request{
		Header: make(http.Header),
	}
	req.Header.Set("X-Correlation-ID", "existing-cid")

	// Mock response writer
	response := &mockResponseWriter{}

	// Handler que verifica se o correlation ID foi propagado
	handlerCalled := false
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		cid := GetCorrelationID(r.Context())
		assert.Equal(t, "existing-cid", cid)
	})

	// Aplica middleware
	middleware := MiddlewareCorrelationID(handler)
	middleware.ServeHTTP(response, req)

	assert.True(t, handlerCalled)
	assert.Equal(t, "existing-cid", response.Header().Get("X-Correlation-ID"))
}

func TestMiddlewareCorrelationID_GenerateNew(t *testing.T) {
	// Mock request sem correlation ID
	req := &http.Request{
		Header: make(http.Header),
	}

	// Mock response writer
	response := &mockResponseWriter{}

	// Handler que verifica se um novo correlation ID foi gerado
	handlerCalled := false
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		cid := GetCorrelationID(r.Context())
		assert.NotEmpty(t, cid)
		assert.Len(t, cid, 36) // UUID
	})

	// Aplica middleware
	middleware := MiddlewareCorrelationID(handler)
	middleware.ServeHTTP(response, req)

	assert.True(t, handlerCalled)
	cid := response.Header().Get("X-Correlation-ID")
	assert.NotEmpty(t, cid)
	assert.Len(t, cid, 36)
}
