# makefile for graph-engine
# Go parameters
GOCMD=go
GOGENERATE=$(GOCMD) generate
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
BINARY_NAME=graph-engine
BINARY_UNIX=$(BINARY_NAME)_unix

all: mod build

mod:
	go env -w GO111MODULE=auto
	export PATH=$PATH:$GOPATH/bin
	@if [ ! -d ./go.mod ]; then go env -w GO111MODULE=on; go env -w GOPROXY=http://repository.aishu.cn:8081/repository/go-all/; go env -w GOSUMDB=off; go env -w GOPRIVATE=gitlab.aishu.cn/anydata-rnd; $(GOMOD) init $(BINARY_NAME); $(GOMOD) vendor; fi

cleanall:
	rm -rf ./vendor
	rm -f go.mod
	rm -f go.sum
	rm -f ./$(BINARY_NAME)
	rm -f ./$(BINARY_UNIX)

build:
	CGO_ENABLED=0 GOOS=linux $(GOBUILD) -a -installsuffix cgo -o $(BINARY_NAME) -v

