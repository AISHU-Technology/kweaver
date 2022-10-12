# 基于镜像基础
FROM kweaverai/builder-python:1.0.1.17

# 设置代码文件夹工作目录 /app
WORKDIR /app
# 复制当前代码文件到容器中 /app
ADD . /app

# 卸载基础镜像中的DataTransform，安装指定分支，默认安装develop，替换celery.py源码，加入自定义pytorch模型类
RUN cp -f /app/celery_task/celery_pytorch.py  /usr/local/lib/python3.9/site-packages/celery/bin/celery.py && \
    let TIMESTAMP=`date +%s`+900 && \
    pip uninstall -y DataTransform && \
    wget "https://obs.cn-east-3.myhuaweicloud.com:443/obs-as7feijiegouzhengshihuanjing/013c7296-9b20-4572-9657-c68e93e5d476/4A5F05BEA8CA42F59E3ABF9B8B810BD2/DB768AC3F94C462782F32FF7EBB7D020?response-content-disposition=attachment%3B%20filename%2A%3Dutf-8%27%27DataTransform%252d0.0.1%252dpy3%252dnone%252dany.whl&AWSAccessKeyId=VXGFIHWYOESD3UA40XFF&Expires=$TIMESTAMP&Signature=QijJ7aqZEmwvuHvTEODDmgiO%2b7w%3d" \
    && pip install DataTransform-0.0.1-py3-none-any.whl -i https://repo.huaweicloud.com/repository/pypi/simple/ \
    && wget "https://obs.cn-east-3.myhuaweicloud.com:443/obs-as7feijiegouzhengshihuanjing/013c7296-9b20-4572-9657-c68e93e5d476/4A5F05BEA8CA42F59E3ABF9B8B810BD2/FA4739E115C141D08491D8DF30C5A48A?response-content-disposition=attachment%3B%20filename%2A%3Dutf-8%27%27builder%255fmodel.tar&AWSAccessKeyId=VXGFIHWYOESD3UA40XFF&Expires=$TIMESTAMP&Signature=xvk0NOy4Aboxs5gq7JQtShaAVz4%3d" \
    && tar -xvf builder_model.tar -C ./unstructedmodel/ && rm -rf builder_model.tar

EXPOSE 6475
EXPOSE 6485
EXPOSE 6488
ENV PYTHONOPTIMIZE=1
CMD ["supervisord", "-c", "/app/supervisord.conf"]

