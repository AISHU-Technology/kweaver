import uvicorn
from app.utils.app_utils import create_app
from fastapi.responses import JSONResponse
from app.utils.stand_log import StandLogger

app = create_app()

@app.get("/")
async def root():
    json = {"ans": "服务连接成功"}
    return JSONResponse(status_code=200, content=json)


if __name__ == '__main__':
    StandLogger.info_log("------------启动 log------------")
    uvicorn.run(app='main:app', host='0.0.0.0', port=9898)
