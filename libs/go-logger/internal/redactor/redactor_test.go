package redactor

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDefaultRedactor(t *testing.T) {
	redactor := DefaultRedactor()
	assert.NotNil(t, redactor)

	// Testa redação de dados sensíveis
	data := map[string]interface{}{
		"name":     "João Silva",
		"password": "senha123",
		"token":    "abc123def456",
		"email":    "joao@example.com",
		"normal":   "valor normal",
	}

	redacted := redactor.Redact(data)
	assert.NotNil(t, redacted)

	redactedMap := redacted.(map[string]interface{})

	// Campos sensíveis devem ser redatados
	assert.Equal(t, "***", redactedMap["password"])
	assert.Equal(t, "***", redactedMap["token"])
	assert.Equal(t, "***", redactedMap["email"])

	// Campos normais devem permanecer
	assert.Equal(t, "João Silva", redactedMap["name"])
	assert.Equal(t, "valor normal", redactedMap["normal"])
}

func TestNewRedactor(t *testing.T) {
	options := RedactorOptions{
		Keys:     []string{"secret", "internal"},
		Patterns: []string{`\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b`},
		Mask:     "REDACTED",
		MaxDepth: 10,
	}

	redactor := NewRedactor(options)
	assert.NotNil(t, redactor)

	// Testa redação com configurações customizadas
	data := map[string]interface{}{
		"name":        "João Silva",
		"secret":      "minha-senha-secreta",
		"cardNumber":  "1234 5678 9012 3456",
		"internal":    "dados internos",
		"normalField": "valor normal",
	}

	redacted := redactor.Redact(data)
	assert.NotNil(t, redacted)

	redactedMap := redacted.(map[string]interface{})

	// Campos configurados devem ser redatados
	assert.Equal(t, "REDACTED", redactedMap["secret"])
	assert.Equal(t, "REDACTED", redactedMap["internal"])
	assert.Equal(t, "REDACTED", redactedMap["cardNumber"])

	// Campos normais devem permanecer
	assert.Equal(t, "João Silva", redactedMap["name"])
	assert.Equal(t, "valor normal", redactedMap["normalField"])
}

func TestRedactorWithCustomMask(t *testing.T) {
	options := RedactorOptions{
		Keys:        []string{"password"},
		Mask:        "HIDDEN",
		KeepLengths: false,
		MaxDepth:    10,
	}

	redactor := NewRedactor(options)

	data := map[string]interface{}{
		"name":     "João",
		"password": "senha123",
	}

	redacted := redactor.Redact(data)
	redactedMap := redacted.(map[string]interface{})

	assert.Equal(t, "HIDDEN", redactedMap["password"])
	assert.Equal(t, "João", redactedMap["name"])
}

func TestRedactorWithKeepLengths(t *testing.T) {
	options := RedactorOptions{
		Keys:        []string{"password"},
		Mask:        "*",
		KeepLengths: true,
		MaxDepth:    10,
	}

	redactor := NewRedactor(options)

	data := map[string]interface{}{
		"name":     "João",
		"password": "senha123",
	}

	redacted := redactor.Redact(data)
	redactedMap := redacted.(map[string]interface{})

	// Deve manter o comprimento original
	assert.Equal(t, "********", redactedMap["password"]) // 8 caracteres
	assert.Equal(t, "João", redactedMap["name"])
}

func TestRedactorWithMaxDepth(t *testing.T) {
	options := RedactorOptions{
		Keys:     []string{"secret"},
		MaxDepth: 2,
	}

	redactor := NewRedactor(options)

	// Estrutura aninhada profunda
	data := map[string]interface{}{
		"level1": map[string]interface{}{
			"level2": map[string]interface{}{
				"level3": map[string]interface{}{
					"secret": "deep-secret",
					"normal": "deep-normal",
				},
			},
		},
	}

	redacted := redactor.Redact(data)
	assert.NotNil(t, redacted)

	// Verifica se a profundidade foi respeitada
	redactedMap := redacted.(map[string]interface{})
	level1 := redactedMap["level1"].(map[string]interface{})
	level2 := level1["level2"].(map[string]interface{})

	// No nível 3, deve retornar [MaxDepth] devido ao limite
	assert.Equal(t, "[MaxDepth]", level2["level3"])
}

func TestRedactorWithCircularReference(t *testing.T) {
	redactor := DefaultRedactor()

	// Cria referência circular
	parent := make(map[string]interface{})
	child := make(map[string]interface{})

	parent["child"] = child
	child["parent"] = parent
	parent["name"] = "parent"
	child["name"] = "child"

	redacted := redactor.Redact(parent)
	assert.NotNil(t, redacted)

	redactedMap := redacted.(map[string]interface{})
	assert.Equal(t, "parent", redactedMap["name"])

	// A referência circular deve ser tratada
	childMap := redactedMap["child"].(map[string]interface{})
	assert.Equal(t, "child", childMap["name"])
	assert.Equal(t, "[Circular]", childMap["parent"])
}

func TestRedactorWithArray(t *testing.T) {
	options := RedactorOptions{
		Keys:     []string{"secret"},
		Mask:     "***",
		MaxDepth: 10,
	}

	redactor := NewRedactor(options)

	data := []interface{}{
		"item1",
		map[string]interface{}{
			"secret": "secret1",
			"normal": "normal1",
		},
		"item3",
	}

	redacted := redactor.Redact(data)
	assert.NotNil(t, redacted)

	redactedArray := redacted.([]interface{})
	assert.Len(t, redactedArray, 3)
	assert.Equal(t, "item1", redactedArray[0])
	assert.Equal(t, "item3", redactedArray[2])

	// Verifica redação no item do meio
	item := redactedArray[1].(map[string]interface{})
	assert.Equal(t, "***", item["secret"])
	assert.Equal(t, "normal1", item["normal"])
}

func TestRedactorWithSpecialTypes(t *testing.T) {
	redactor := DefaultRedactor()

	data := map[string]interface{}{
		"string": "test",
		"number": 123,
		"bool":   true,
		"nil":    nil,
	}

	redacted := redactor.Redact(data)
	assert.NotNil(t, redacted)

	redactedMap := redacted.(map[string]interface{})
	assert.Equal(t, "test", redactedMap["string"])
	assert.Equal(t, 123, redactedMap["number"])
	assert.Equal(t, true, redactedMap["bool"])
	assert.Nil(t, redactedMap["nil"])
}

func TestRedactorWithErrorHandling(t *testing.T) {
	// Testa redator com configurações que podem causar erro
	options := RedactorOptions{
		Keys:     []string{"password"},
		MaxDepth: 0, // Profundidade muito baixa
	}

	redactor := NewRedactor(options)

	// Dados que podem causar problemas
	data := map[string]interface{}{
		"password": "senha",
		"nested": map[string]interface{}{
			"value": "test",
		},
	}

	// Deve lidar com erro graciosamente
	redacted := redactor.Redact(data)
	assert.NotNil(t, redacted)
}

func TestRedactorWithPatterns(t *testing.T) {
	options := RedactorOptions{
		Patterns: []string{`\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b`}, // CPF
		Mask:     "CPF_REDACTED",
		MaxDepth: 10,
	}

	redactor := NewRedactor(options)

	data := map[string]interface{}{
		"name": "João Silva",
		"cpf":  "123.456.789-01",
		"text": "Meu CPF é 123.456.789-01 e outro é 987.654.321-00",
	}

	redacted := redactor.Redact(data)
	redactedMap := redacted.(map[string]interface{})

	assert.Equal(t, "João Silva", redactedMap["name"])
	assert.Equal(t, "CPF_REDACTED", redactedMap["cpf"])
	assert.Equal(t, "Meu CPF é CPF_REDACTED e outro é CPF_REDACTED", redactedMap["text"])
}
