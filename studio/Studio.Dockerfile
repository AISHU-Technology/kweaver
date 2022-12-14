FROM node:14-slim as nodemake
RUN mkdir -p /root/studio && \
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
npm install cnpm -g --registry=https://r.npm.taobao.org
WORKDIR /root/studio/
COPY . .
WORKDIR /root/studio/webui
RUN cnpm i && cnpm run build

FROM golang:1.17 as gomake
RUN mkdir -p /root/studio
WORKDIR /root/studio/
COPY . .
COPY --from=nodemake /root/studio/webui/build/* /root/studio/webui/build/
RUN mkdir /root/studio/webui/build/static && \
mv /root/studio/webui/build/js /root/studio/webui/build/static && \
mv /root/studio/webui/build/css /root/studio/webui/build/static && \
mv /root/studio/webui/build/media /root/studio/webui/build/static
RUN ls -R . && \
go env -w GO111MODULE=on && \
go env -w GOPROXY=https://goproxy.cn,direct && \
go env -w GOPRIVATE=gitlab.aishu.cn && \
go get -u github.com/swaggo/swag/cmd/swag && \
go mod tidy && \
swag init && \
go build -o studio ./main.go

FROM xavierhuang/ubuntu:v1
RUN apt-get install -y tzdata && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
COPY --from=gomake /root/studio/studio /root/studio/
COPY ./config.yaml /root/studio/
WORKDIR /root/studio
EXPOSE 6800
CMD ["./studio"]

