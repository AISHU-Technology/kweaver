# -*- coding: utf-8 -*-


import os
import logging
from logging.config import fileConfig

import uvicorn
import click

# init log
fileConfig(os.path.join(os.path.dirname(__file__), 'configs', 'log.ini'), disable_existing_loggers=False)
# 获取Logger
logger = logging.getLogger(__name__)


@click.group()
def cli():
    logger.info('Init app...')
    pass


@cli.command()
def run_api_server():
    """
    启动服务
    """

    logger.info(f'Run api server...')
    port: int = os.getenv('PORT', 8080)

    dual_stack = os.getenv('DUAL_STACK')
    if dual_stack and dual_stack.lower() == 'true':
        host = "::"
        logger.info(f"bind ip is http://[::]:{port}")
    else:
        logger.info(f"bind ip is http://0.0.0.0:{port}")
        host = "0.0.0.0"
        # start server
    uvicorn.run(
        'app.fastapi_app:fast_app',
        host=host,
        port=port,
    )


if __name__ == '__main__':
    run_api_server()
