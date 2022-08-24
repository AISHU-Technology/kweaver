FROM node:12-slim as nodemake
RUN mkdir -p /root/studio && \
    cd /root/studio && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    npm install cnpm -g --registry=https://r.npm.taobao.org
COPY ./webui/* .
RUN npm run build

FROM golang:1.16 as gomake
RUN mkdir -p /root/studio && cd /root/studio
COPY . .
RUN rm -rf ./webui/*
COPY --from=nodemake /root/studio/build/* ./webui
RUN go env -w GO111MODULE=on && \
    go env -w GOPROXY=https://goproxy.cn,direct && \
    go env -w GOSUMDB=off && \
    go build -o studio ./main.go

FROM acr.aishu.cn/public/ubuntu:21.10.20211119
RUN apt-get install -y tzdata && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
COPY --from=gomake /root/studio/studio /root/studio/
COPY ./config.yaml /root/studio/
WORKDIR /root/studio
EXPOSE 6800
CMD ["./studio"]

