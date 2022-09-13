# -*-coding:utf-8-*-
# @Time    : 2020/10/17 17:41
# @Author  : Lowe.li
# @Email   : Lowe.li@aishu.cn
from enum import Enum


class CommonResponseStatus(Enum):
    SUCCESS = 200
    BAD_REQUEST = 400
    SERVER_ERROR = 500
    PERMISSION_DENIED = 500
    NOT_FOUND = 404
    DATABASE_ERROR = 510
    TIMEOUT = 408
    CONNECTION_FAILED = 520
    NO_LOGIN = 405  # 未登录
    PARAMETERS_ERROR = 400000
    REQUEST_ERROR = 500001
    USRPASS_ERROR = 500002
    KGDB_ERROR = 500003
    KGDB_KGNAME_ERROR = 500004
    DELETE_USEDDS_ERROR = 500005
    DS_NO_EXIST_ERROR = 500006
    DB_IP_ERROR = 500007
    DB_IP_KGNAME_ERROR = 500008
    KGID_NOT_EXIST = 500101  # kg id 不存在
    KG_DB_EMPTY = 500102  # kg 知识量为空
    KG_DB_RUNNING = 500103  # kg 正在构建
    SUBJECT_ID_EXIST = 500104  # subject id 已存在
    SUBJECT_ID_NOT_EXIST = 500105  # subject id 不存在
    KG_AS_MODEL_NOT_EXIST = 500106  # kg 不存在as文档模型

    # RabbitMQ 测试连接错误码
    VHOST_ERROR = 500014
    QUEUE_ERROR = 500015
    HOST_PORT_ERROR = 500016

    # 任务错误码
    NO_FILE_FALSE = 500009
    EDIT_USED_ERROR = 500010
    DS_ADDRESS_ERROR = 500011
    UNVERIFY_ERROR = 500012
    TOKEN_OVERDUE_ERROR = 500013

    TASK_RUN_NO_GRAPH = 500021
    TASK_RUN_RUNNING = 500022

    CANT_SAVE_OTL = 500026
    OTL_EXIST_ERR = 500025
    OUT_OF_LIMIT = 500027

    PERMISSION_ERROR = 500403

    # 图谱删除错误码
    ALL_RUNNING = 500030
    RUNNING_AND_NORMAL = 500031
    RUNNING_AND_PERMISSION = 500032
    PERMISSION_AND_NORMAL = 500033
    ALL_PERMISSION = 500034
    RUNNING_AND_PERMISSION_AND_NORMAL = 500035
    SINGLE_RUNNING = 500036
    SINGLE_PERMISSION = 500037
    GRAPH_PERMISSION_DELETE_ERR = 500038

    # 本体开放api错误
    OTL_OPEN_GRAPH_NOT_EXIST = 500042
    OTL_OPEN_GRAPH_RUNNING = 500041
    OTL_OPEN_GRAPH_CANNOT_USE = 500049
    OTL_OPEN_GRAPH_DB_NOT_EXIST = 500048
    OTL_OPEN_NAME_EXIST = 500043

    # 定时任务错误码
    TIMER_TASK_NOT_EXIST = 500051
    GRAPH_NOT_MATCH_TIMER = 500052
    TIME_LESS_NOW = 500053
    Expired_TIMED_TASK = 500054

    # 执行任务时，授权知识量不足，无法执行任务
    INSUFFUCIENT_CAPACITY = 500055

    # 执行任务时存储地址被删除
    INVALID_STORAGE_ADDRESS = 500056

    INVALID_KNW_ID = 500057
    GRAPH_NOT_KNW = 500058
    GRAPH_UPLOAD = 500059
    GRAPH_UPLOAD_NOT_RUN = 500065
    GRAPH_UPLOAD_NOT_EDIT = 500066

    # engine 接口迁移部分
    USER_HAS_NOT_VIEWABLE_GRAPH = 500060
    USER_HAS_NOT_VIEWABLE_GRAPH_IN_NET = 500061
    UUID_NOT_FOUND = 500062

    UUID_USER_NOT_FOUND = 500063

    # 知识网络部分
    KNW_NOT_EXISTS = 500064
