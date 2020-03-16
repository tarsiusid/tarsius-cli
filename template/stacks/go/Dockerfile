FROM golang:1.11-alpine

ENV TS_DB_HOST="db-worker" \
    TS_DB_USER="root" \
    TS_DB_PASS="" \
    TS_DB_NAME="tarsius" \
    TS_DB_PORT="26257" \
    TS_API_NAME="<service_name>" \ 
    TS_REDIS_HOSTS="redis:6379"

WORKDIR /${TS_API_NAME}
COPY . /${TS_API_NAME}

RUN apk add -q --update \
  && apk add -q \
  git gcc musl-dev \
  && rm -rf /var/cache/apk/* \
  && unset GOPATH \
  && go mod init ${PWD} \
  && go build -o <project_name> \
  && apk del gcc

CMD ["./<project_name>"]