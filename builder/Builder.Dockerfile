# 基于镜像基础
FROM kweaverai/builder-python:1.0.1.17

# 设置代码文件夹工作目录 /app
WORKDIR /app
# 复制当前代码文件到容器中 /app
ADD . /app

# 卸载基础镜像中的DataTransform，安装指定分支，默认安装develop，替换celery.py源码，加入自定义pytorch模型类
RUN cp -f /app/celery_task/celery_pytorch.py  /usr/local/lib/python3.9/site-packages/celery/bin/celery.py && \
    pip uninstall -y DataTransform && \
    wget https://download-ad.eisoo.com.cn/DataTransform-0.0.1-py3-none-any.whl \
    && pip install DataTransform-0.0.1-py3-none-any.whl -i https://repo.huaweicloud.com/repository/pypi/simple/ \
    && wget https://download-ad.eisoo.com.cn/builder_model.tar \
    && tar -xvf builder_model.tar -C ./unstructedmodel/ && rm -rf builder_model.tar

EXPOSE 6475
EXPOSE 6485
EXPOSE 6488
ENV PYTHONOPTIMIZE=1
CMD ["supervisord", "-c", "/app/supervisord.conf"]

