FROM nginx:1.18-alpine
RUN apk add tzdata \
    && ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && mkdir /etc/nginx/ssl 
ADD ./conf/nginx.conf /etc/nginx/nginx.conf
ADD ./build /var/apphome/web
COPY ./ssl/* /etc/nginx/ssl/
EXPOSE 80
EXPOSE 443
EXPOSE 6475