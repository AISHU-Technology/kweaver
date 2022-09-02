import logging
from dataclasses import dataclass

import yaml

class ReadConfig():
    def read_yaml():
        # 模块内配置文件
        try:
            with open("../configs/config.yaml", "r", encoding="utf-8") as f:
                data = yaml.load(f, Loader=yaml.FullLoader)
                return data
        except:
            logging.info("no yaml file")
            return None

    def read_yaml_global():
        try:
            # 全局配置文件
            with open("./test.yaml", "r", encoding="utf-8") as f:
                data = yaml.load(f, Loader=yaml.FullLoader)
                return data
        except:
            logging.info("no global yaml file")
            return None

    config_local = read_yaml()
    config_global = read_yaml_global()
    if config_global is not None:
        for a_config in config_local.keys():
            if config_global[a_config] is not None:
                config_local[a_config].update(config_global[a_config])
    c = config_local
