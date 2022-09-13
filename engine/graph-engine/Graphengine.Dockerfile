FROM alpine:3.11
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add tzdata && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && ls -R .
FROM golang:1.17 as gomake
RUN mkdir -p /root/graph-engine
WORKDIR /root/graph-engine/
COPY . .
RUN ls && \
go env -w GO111MODULE=on && \
go env -w GOPROXY=https://goproxy.cn,direct && \
go env -w GOPRIVATE=gitlab.aishu.cn && \
go mod tidy && \
go build -o graph-engine && \
ls -R .. 

ADD ./graph-engine/graph-engine /root/graph-engine/
ADD conf /root/graph-engine/conf
ADD utils/direactory.txt /root/graph-engine/utils/
ADD resources /root/graph-engine/resources

VOLUME [./graph-engine/conf]


EXPOSE 6474
CMD ["./graph-engine"]

