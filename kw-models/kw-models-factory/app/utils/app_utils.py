from fastapi import FastAPI

from app.routers import router_init
from app.utils.stand_log import StandLogger


def conf_init(app):
    import os
    environment = os.getenv('ENVIRONMENT', 'development')
    if environment == 'production':
        app.docs_url = None
        app.redoc_url = None
        app.debug = False


async def start_event():
    StandLogger.info_log('INFO:     系统启动')


async def shutdown_event():
    StandLogger.info_log('INFO:     系统关闭')

def create_app():
    app = FastAPI(title="kw-models-factory",
                  description="",
                  version="1.0.0",
                  on_startup=[start_event],
                  on_shutdown=[shutdown_event])
    # 加载配置
    conf_init(app)
    # 初始化路由配置
    router_init(app)
    return app
