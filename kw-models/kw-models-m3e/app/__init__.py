from app import m3e_api
from fastapi import FastAPI


def register_router(app):
    """
    路由
    :param app: FastAPI
    :return:
    """
    app.include_router(
        m3e_api.router,
        tags=["m3e"],
        responses={404: {"description": "Not found"}},
    )


def create_app():
    app = FastAPI(title="kw-models-m3e",
                  description="",
                  version="1.0.0")
    register_router(app)
    return app
