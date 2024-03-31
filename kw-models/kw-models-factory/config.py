import os
from typing import Optional

from pydantic import BaseSettings


class Settings(BaseSettings):
    """System configurations."""
    # 系统环境
    API_V1_STR = "/api/model-factory/v1"


class FactoryConfig:
    """Returns a config instance dependending on the ENV_STATE variable."""

    def __init__(self, env_state: Optional[str]):
        self.env_state = env_state

    def __call__(self):
        if self.env_state == "development":
            return Settings()

        elif self.env_state == "production":
            return Settings()

        elif self.env_state == "testing":
            return Settings()


def get_configs():
    """加载一下环境文件"""
    return FactoryConfig(os.getenv('ENVIRONMENT', 'development'))()


configs = get_configs()
