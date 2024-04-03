FROM python:3.9.19-slim-bullseye
WORKDIR /app
ADD . /app
RUN sed -i "s@http://deb.debian.org@http://mirrors.aliyun.com@g" /etc/apt/sources.list  && apt-get update && apt-get install -y libpq-dev gcc && apt-get install -y unixodbc  && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && pip install --upgrade pip -i https://mirrors.aliyun.com/pypi/simple/ && pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/ && find /usr/local/lib -name '*.pyc' -delete &&  pip cache purge
EXPOSE 6475 6485 6488
ENV PYTHONOPTIMIZE=1 ENABLE_SYSTEM_LOG=true
CMD ["supervisord", "-c", "/app/supervisord.conf"]
