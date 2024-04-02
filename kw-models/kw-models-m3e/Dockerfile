FROM python:3.9.19-slim-bullseye
WORKDIR /app
ADD . /app/
RUN apt-get update && apt-get install -y git-lfs && pip install --upgrade pip -i https://mirrors.aliyun.com/pypi/simple/ && pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ && \
    git lfs install && git clone https://www.modelscope.cn/Jerry0/m3e-base.git /app/models/m3e-base
EXPOSE 9897
ENTRYPOINT [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9897", "--workers", "2"]