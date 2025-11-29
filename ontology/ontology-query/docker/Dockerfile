########################### Stage 0 ########################
ARG BUILD_IMAGE=acr.aishu.cn/ar/go.build:1.23.7-20250311
ARG BASE_IMAGE=acr.aishu.cn/public/ubuntu:22.04.20251014

FROM ${BUILD_IMAGE} AS builder

COPY ./server /go/src

COPY .netrc /root/.netrc
COPY id_rsa /root/.ssh/id_rsa

ARG SERVER_VERSION=6.0.0
ARG GOPROXY_URL="http://goproxy.cn,direct"

ENV GOPROXY=${GOPROXY_URL}

RUN set -ex; \
    cd /go/src; \
    go mod download -x; \
    CGO_ENABLED=1 go build -ldflags "-s -w" -o ./bin/ontology-query-server;

########################### Stage 1 ########################
# Copy working directory to the actual release docker images
FROM ${BASE_IMAGE} AS prod

ARG UID=1000
ARG GID=1000

RUN groupadd -r -g $GID anyrobot \
    && useradd -r -u $UID -g $GID anyrobot

COPY --from=builder --chown=$UID:$GID /go/src/bin /opt/ontology-query

ADD server/config/ontology-query-config.yaml /opt/ontology-query/config/
ADD server/locale /opt/ontology-query/locale


# 指定工作目录
WORKDIR /opt/ontology-query/

# Change user
USER $UID

# Expose port
EXPOSE 13018

# 指定启动命令
ENTRYPOINT [ "./ontology-query-server" ]
