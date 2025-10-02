module apps/go-api

go 1.22

require github.com/mateusmacedo/boyscout/go-logger v0.0.0

require (
	github.com/google/uuid v1.3.0 // indirect
	github.com/sirupsen/logrus v1.9.3 // indirect
	golang.org/x/sys v0.10.0 // indirect
)

replace github.com/mateusmacedo/boyscout/go-logger => ../../libs/go-logger
