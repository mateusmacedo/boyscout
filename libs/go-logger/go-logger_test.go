package gologger

import (
	"testing"
)

func TestGoLogger(t *testing.T) {
	result := GoLogger("works")
	if result != "GoLogger works" {
		t.Error("Expected GoLogger to append 'works'")
	}
}
