# -*- coding: utf-8 -*-
import pika
import json


def rabbit_start_listening(args):
    """
    启动RabbitMq监听
    Args：
        args：dict， 连接RabbitMQ的配置参数，以及回调函数使用的其他参数
    """
    # 配置RabbitMQ账号密码
    credentials = pika.PlainCredentials(args.get("ds_user", ""), args.get("ds_password", ""))
    # 连接RabbitMQ server
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=args.get("ds_address", ""),
                                                                   port=args.get("ds_port", 5672),
                                                                   virtual_host=args.get("vhost", ""),
                                                                   heartbeat=0,
                                                                   credentials=credentials))
    # 创建链接通道
    channel = connection.channel()

    def callback(ch, method, properties, body):
        print("Received msg: {}".format(body))
        body = json.loads(body)
        rabbitmq_task = args.get("rabbitmq_task")
        rabbitmq_task(body, args)


    # channel.queue_declare(queue=queue)
    # 从队列中取出一条消息，及时回调(auto_ack=True)，生产者会将该任务消息删除，同时该消息作为json_data值去调用callback方法处理
    channel.basic_consume(queue=args.get("queue", ""), on_message_callback=callback, auto_ack=True)
    # 消费消息并处于监听状态,开始消费消息
    print("消息队列 {} 监听中 ... ...".format(args.get("queue", "")))
    channel.start_consuming()