FROM python:3.8.3
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
WORKDIR /root
EXPOSE 8080
COPY ./ /root/
RUN pip install -r /root/requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
RUN pip install /root/dependencies/cognition-0.0.1-py3-none-any.whl
CMD ["python", "manager.py"]
