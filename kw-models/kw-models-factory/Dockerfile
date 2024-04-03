FROM python:3.9.19-slim-bullseye
WORKDIR /app
ADD . /app
RUN pip install --upgrade pip -i https://mirrors.aliyun.com/pypi/simple/ && pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ && find /usr/local/lib -name '*.pyc' -delete &&  pip cache purge
EXPOSE 9898
ENTRYPOINT [ "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9898", "--workers", "1"]