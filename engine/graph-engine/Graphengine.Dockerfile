FROM alpine:3.11
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
RUN apk add tzdata && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
ls
ADD ./engine/graph-engine /root/graph-engine/
ADD conf /root/graph-engine/conf
ADD utils/direactory.txt /root/graph-engine/utils/
ADD resources /root/graph-engine/resources

VOLUME [./graph-engine/conf]
WORKDIR /root/graph-engine

EXPOSE 6474
CMD ["./graph-engine"]
