# -*- coding: utf-8 -*-


import logging
from typing import Callable

from fastapi import FastAPI, APIRouter, Request, Response

from .services import search, check_health

logger = logging.getLogger(__name__)


def init_router(app: FastAPI):
    router = APIRouter()
    router.include_router(search.router, tags=['search'])
    router.include_router(check_health.router, tags=['check'])
    app.include_router(router, prefix='/api/engine')


async def user_define_middleware(request: Request, call_next: Callable) -> Response:
    """
    user define middleware
    :param request:
    :param call_next:
    :return:
    """
    logger.info("start call user_define_middleware")
    response = await call_next(request)
    logger.info("end process user_define_middleware")

    return response


def create_app() -> FastAPI:
    app: FastAPI = FastAPI()

    # import router
    init_router(app)
    # init other middleware
    app.middleware('http')(user_define_middleware)
    return app


# create fast_app
fast_app: FastAPI = create_app()
