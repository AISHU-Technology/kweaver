import logging
import yaml

def readYAML():
    # 模块内配置文件
    try:
        with open("./configs/config.yaml", "r", encoding="utf-8") as f:
            data = yaml.load(f, Loader=yaml.FullLoader)
            return data
    except:
        logging.info("no yaml file")
        return None

def readYAMLglobal():
    try:
        # 全局配置文件
        with open("./test.yaml", "r", encoding="utf-8") as f:
            data = yaml.load(f, Loader=yaml.FullLoader)
            return data
    except:
        logging.info("no global yaml file")
        return None

def getYAML():
    config_local = readYAML()
    config_global = readYAMLglobal()
    if config_global is not None:
        for a_config in config_local.keys():
            if config_global[a_config] is not None:
                config_local[a_config].update(config_global[a_config])
    return config_local