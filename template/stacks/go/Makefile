ifndef
	TAG="latest"
	REGISTRY="registry.gitlab.com/tarsiusid/tarsius/"
	APPNAME="<service_name>"
endif

all: clean build docker-build docker-compile run-dev docker-push fmt init-dev

clean:
	@rm -rf <project_name> vendor

docker-build:
	@echo "*** docker build: builder image"
	docker build -t ${REGISTRY}${APPNAME}:${TAG} .

docker-push:
	docker push ${REGISTRY}${APPNAME}:${TAG}

docker-compile: build
	@echo "*** extract binary"
	docker create --name tmp ${REGISTRY}${APPNAME}:${TAG}
	docker cp tmp:/go/src/gitlab.com/tarsiusid/tarsius/<service_name>/<project_name> .
	docker rm -vf tmp

run-dev:
	@echo "*** execute <project_name> api"
	go run main.go -v

init-dev:
	@echo "*** build dep"
	rm -f go.mod go.sum
	go mod init ${PWD}
	go fmt main.go

fmt:
	go fmt main.go

build: init-dev
	go build -o <project_name> main.go
