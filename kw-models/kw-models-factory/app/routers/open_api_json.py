import os

from fastapi import APIRouter

open_json_router = APIRouter()


@open_json_router.get("/openapi.json")
async def get():
    CUR_PATH = os.getcwd()
    csv_save_path = os.path.join(CUR_PATH, "openapi.json")
    print(csv_save_path)
    openonefile = open(csv_save_path, "r", encoding='utf-8')
    data = openonefile.read()
    globals = {'false': False, 'true': True, 'null': ''}
    res = eval(data, globals)
    return res
