package redactor

import (
	"encoding/json"
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"time"

	"github.com/mateusmacedo/boyscout/go-logger/pkg/types"
)

// redactor implementa a interface Redactor
type redactor struct {
	options        RedactorOptions
	keyRegexes     []*regexp.Regexp
	patternRegexes []*regexp.Regexp
}

// RedactorOptions representa as opções de configuração do redator
type RedactorOptions struct {
	Keys               []string `json:"keys,omitempty"`
	Patterns           []string `json:"patterns,omitempty"`
	Mask               string   `json:"mask,omitempty"`
	MaxDepth           int      `json:"maxDepth,omitempty"`
	KeepLengths        bool     `json:"keepLengths,omitempty"`
	RedactArrayIndices bool     `json:"redactArrayIndices,omitempty"`
}

// NewRedactor cria um novo redator com as opções fornecidas
func NewRedactor(options RedactorOptions) types.Redactor {
	// Compila regexes para chaves
	keyRegexes := make([]*regexp.Regexp, 0, len(options.Keys))
	for _, key := range options.Keys {
		regex, err := regexp.Compile("(?i)^" + regexp.QuoteMeta(key) + "$")
		if err == nil {
			keyRegexes = append(keyRegexes, regex)
		}
	}

	// Compila regexes para padrões
	patternRegexes := make([]*regexp.Regexp, 0, len(options.Patterns))
	for _, pattern := range options.Patterns {
		regex, err := regexp.Compile(pattern)
		if err == nil {
			patternRegexes = append(patternRegexes, regex)
		}
	}

	return &redactor{
		options:        options,
		keyRegexes:     keyRegexes,
		patternRegexes: patternRegexes,
	}
}

// Redact implementa a interface Redactor
func (r *redactor) Redact(data interface{}) interface{} {
	seen := make(map[uintptr]bool)
	return r.redactValue(data, 0, seen)
}

// redactValue redata recursivamente um valor
func (r *redactor) redactValue(value interface{}, depth int, seen map[uintptr]bool) interface{} {
	// Verifica limite de profundidade
	if depth > r.options.MaxDepth {
		return "[MaxDepth]"
	}

	// Verifica se é nil
	if value == nil {
		return nil
	}

	// Obtém o valor refletido
	val := reflect.ValueOf(value)

	// Verifica referências circulares para ponteiros
	if val.Kind() == reflect.Ptr {
		if seen[val.Pointer()] {
			return "[Circular]"
		}
		seen[val.Pointer()] = true
		defer delete(seen, val.Pointer())
	}

	// Verifica referências circulares para maps e slices
	if val.Kind() == reflect.Map || val.Kind() == reflect.Slice {
		// Cria uma chave única baseada no tipo e ponteiro
		key := uintptr(val.Pointer())
		if seen[key] {
			return "[Circular]"
		}
		seen[key] = true
		defer delete(seen, key)
	}

	// Trata tipos primitivos
	switch val.Kind() {
	case reflect.String:
		return r.redactString(val.String())
	case reflect.Bool, reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
		reflect.Float32, reflect.Float64, reflect.Complex64, reflect.Complex128:
		return value
	}

	// Trata tipos especiais
	if special := r.handleSpecialTypes(value); special != nil {
		return special
	}

	// Trata slices/arrays
	if val.Kind() == reflect.Slice || val.Kind() == reflect.Array {
		return r.redactSlice(val, depth, seen)
	}

	// Trata maps
	if val.Kind() == reflect.Map {
		return r.redactMap(val, depth, seen)
	}

	// Trata structs
	if val.Kind() == reflect.Struct {
		return r.redactStruct(val, depth, seen)
	}

	// Trata ponteiros
	if val.Kind() == reflect.Ptr {
		if val.IsNil() {
			return nil
		}
		return r.redactValue(val.Elem().Interface(), depth, seen)
	}

	// Para outros tipos, retorna como string
	return fmt.Sprintf("[%s]", val.Type().String())
}

// redactString redata uma string aplicando padrões regex
func (r *redactor) redactString(s string) string {
	result := s

	// Aplica padrões regex
	for _, regex := range r.patternRegexes {
		result = regex.ReplaceAllStringFunc(result, func(match string) string {
			return r.getMask(match)
		})
	}

	return result
}

// redactSlice redata um slice/array
func (r *redactor) redactSlice(val reflect.Value, depth int, seen map[uintptr]bool) interface{} {
	length := val.Len()
	result := make([]interface{}, length)

	for i := 0; i < length; i++ {
		// Verifica se deve redatar índices de array
		if r.options.RedactArrayIndices && r.shouldRedactKey(fmt.Sprintf("%d", i)) {
			result[i] = r.getMask(val.Index(i).Interface())
		} else {
			// Redata o valor do item
			itemValue := val.Index(i).Interface()
			if r.shouldRedactValue(itemValue) {
				result[i] = r.getMask(itemValue)
			} else {
				result[i] = r.redactValue(itemValue, depth+1, seen)
			}
		}
	}

	return result
}

// redactMap redata um map
func (r *redactor) redactMap(val reflect.Value, depth int, seen map[uintptr]bool) interface{} {
	result := make(map[string]interface{})

	for _, key := range val.MapKeys() {
		keyStr := fmt.Sprintf("%v", key.Interface())
		value := val.MapIndex(key).Interface()

		if r.shouldRedactKey(keyStr) {
			result[keyStr] = r.getMask(value)
		} else {
			result[keyStr] = r.redactValue(value, depth+1, seen)
		}
	}

	return result
}

// redactStruct redata uma struct
func (r *redactor) redactStruct(val reflect.Value, depth int, seen map[uintptr]bool) interface{} {
	result := make(map[string]interface{})
	typ := val.Type()

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		fieldVal := val.Field(i)

		// Pula campos não exportados
		if !fieldVal.CanInterface() {
			continue
		}

		fieldName := field.Name
		value := fieldVal.Interface()

		if r.shouldRedactKey(fieldName) {
			result[fieldName] = r.getMask(value)
		} else {
			result[fieldName] = r.redactValue(value, depth+1, seen)
		}
	}

	return result
}

// shouldRedactKey verifica se uma chave deve ser redatada
func (r *redactor) shouldRedactKey(key string) bool {
	for _, regex := range r.keyRegexes {
		if regex.MatchString(key) {
			return true
		}
	}
	return false
}

// shouldRedactValue verifica se um valor deve ser redatado baseado em padrões
func (r *redactor) shouldRedactValue(value interface{}) bool {
	// Converte para string para aplicar padrões regex
	str := fmt.Sprintf("%v", value)

	// Aplica padrões regex
	for _, regex := range r.patternRegexes {
		if regex.MatchString(str) {
			return true
		}
	}

	return false
}

// getMask retorna a máscara apropriada para um valor
func (r *redactor) getMask(value interface{}) string {
	if r.options.KeepLengths {
		if str, ok := value.(string); ok {
			return strings.Repeat("*", len(str))
		}
	}
	return r.options.Mask
}

// handleSpecialTypes trata tipos especiais como time.Time, error, etc.
func (r *redactor) handleSpecialTypes(value interface{}) interface{} {
	switch v := value.(type) {
	case time.Time:
		return v.Format(time.RFC3339Nano)
	case error:
		return map[string]interface{}{
			"name":    reflect.TypeOf(v).Name(),
			"message": v.Error(),
		}
	case json.RawMessage:
		return "[JSON]"
	}
	return nil
}

// DefaultRedactor cria um redator com configurações padrão
func DefaultRedactor() types.Redactor {
	return NewRedactor(RedactorOptions{
		Keys: []string{
			"password", "passwd", "pass", "pwd",
			"token", "access_token", "refresh_token",
			"authorization", "auth", "secret",
			"apiKey", "api_key", "apikey",
			"client_secret", "card", "cardNumber",
			"cvv", "cvc", "ssn", "cpf", "cnpj",
		},
		Patterns: []string{
			`\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b`,          // CPF
			`\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b`,  // CNPJ
			`\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b`, // Email
			`\b(?:[A-Fa-f0-9]{32,64})\b`,                // Hashes
		},
		Mask:               "***",
		MaxDepth:           5,
		KeepLengths:        false,
		RedactArrayIndices: true,
	})
}
