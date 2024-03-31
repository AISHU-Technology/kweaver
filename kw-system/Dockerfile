FROM golang:1.20.13-alpine3.19 AS gomake
WORKDIR /app/kw-system/
COPY . .
RUN go env -w GO111MODULE=on \
    && go env -w GOPROXY=https://goproxy.cn
RUN go build -o kw-system ./main.go

FROM ubuntu:20.04
COPY --from=gomake /app/kw-system/kw-system /app/kw-system/
ADD ./etc/ /app/kw-system/etc
WORKDIR /app/kw-system
EXPOSE 8001
CMD ["./kw-system"]