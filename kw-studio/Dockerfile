#FROM node:18.12.1 as buildStaticFiles
#WORKDIR /root/kw-studio
#COPY . .
#RUN yarn && yarn build

FROM nginx:1.25-alpine-slim
COPY  ./build /var/apphome/web
COPY ./nginx.conf /etc/nginx/conf.d/nginx.conf
EXPOSE 80
