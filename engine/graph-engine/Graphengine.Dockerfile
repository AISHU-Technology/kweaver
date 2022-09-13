FROM alpine:3.11
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN ls -R . && \
go env -w GO111MODULE=on && \
go env -w GOPROXY=https://goproxy.cn,direct && \
go env -w GOPRIVATE=gitlab.aishu.cn && \
go mod tidy && \
go build -o graph-engine ./main.go
RUN apk add tzdata && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && ls -R .
ADD ./graph-engine /root/graph-engine/
ADD conf /root/graph-engine/conf
ADD utils/direactory.txt /root/graph-engine/utils/
ADD resources /root/graph-engine/resources

VOLUME [./graph-engine/conf]
WORKDIR /root/graph-engine

EXPOSE 6474
CMD ["./graph-engine"]

