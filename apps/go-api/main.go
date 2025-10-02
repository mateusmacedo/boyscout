package main

import (
	"fmt"

	"github.com/mateusmacedo/boyscout/go-logger"
)

func Hello(name string) string {
	result := "Hello " + name
	return result
}

func main() {
	fmt.Println(gologger.GoLogger(Hello("go-api")))
}
