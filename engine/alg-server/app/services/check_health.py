# -*- coding: utf-8 -*-
from fastapi import APIRouter


router = APIRouter(prefix='/v1/health', tags=['check'])


@router.get('/ready')
async def get():
    return "success"


@router.get('/alive')
async def get():
    return "success"
