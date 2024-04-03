FROM golang:1.20.13-alpine3.19 AS gomake
WORKDIR /app/kw-graph/
COPY . .
RUN go env -w GO111MODULE=on && go env -w GOPROXY=https://goproxy.cn
RUN go build -o kw-graph ./main.go

FROM  ubuntu:20.04
COPY --from=gomake  /app/kw-graph/kw-graph /app/kw-graph/
ADD ./etc/ /app/kw-graph/etc
ADD ./utils/ /app/kw-graph/utils
WORKDIR /app/kw-graph
EXPOSE 6480
CMD ["./kw-graph"]