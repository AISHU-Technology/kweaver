from app.routers import model_router, prompt_router, open_api_json
from config import configs


def router_init(app):
    app.include_router(
        model_router.router01,
        prefix=configs.API_V1_STR,
        tags=["Factory"],
        responses={404: {"description": "Not found"}},
    )
    app.include_router(
        prompt_router.router02,
        prefix=configs.API_V1_STR,
        tags=["Factory"],
        responses={404: {"description": "Not found"}},
    )
    app.include_router(
        open_api_json.open_json_router,
        prefix=configs.API_V1_STR,
        tags=["Factory"],
        responses={404: {"description": "Not found"}},
    )


