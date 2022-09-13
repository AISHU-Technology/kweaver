FROM node:12-slim
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
WORKDIR /root/studio
RUN npm install cnpm -g --registry=https://r.npm.taobao.org

# 通过挂载的方式构建，所以不需要在容器里面 Install
# ADD . /root/studio
# RUN cnpm install
# EXPOSE 8080
CMD ["npm", "run", "build"]