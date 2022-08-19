# -*- coding:utf-8 -*-
from flask_babel import gettext as _l

errDict = {
    'Builder.GraphController.GetGraphInfoBasic.ParamError': {
        "errorcode": "Builder.GraphController.GetGraphInfoBasic.ParamError",
        "description": "[description]",
        "cause": _l("Parameter [arg] Error."),  # 参数[arg]错误
        "solution": _l("Please check your parameter again.")  # 请重新检查输入参数
    },
    'Builder.GraphController.GetGraphInfoBasic.UnknownError': {
        "errorcode": "Builder.GraphController.GetGraphInfoBasic.UnknownError",
        "description": "[description]",
        "cause": _l("[cause]"),
        "solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.GetGraphInfoBasic.GraphidNotExist': {
        "errorcode": "Builder.GraphService.GetGraphInfoBasic.GraphidNotExist",
        "description": _l("graphid [graphid] not exists."),
        "cause": _l("graphid [graphid] not exists."),
        "solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GetGraphInfoBasic.KeyTypeError': {
        "errorcode": "Builder.GraphController.GetGraphInfoBasic.KeyTypeError",
        "description": _l('key type error'),  # "key类型错误",
        "cause": _l('key should be list of string'),  # "key应为字符串列表",
        "solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphService.GetGraphInfoBasic.GraphDBIdNotExist': {
        "errorcode": "Builder.GraphService.GetGraphInfoBasic.GraphDBIdNotExist",
        "description": _l('graphdb id [graphdb_id] not exists'),  # "图数据库id [graphdb_id] 不存在",
        "cause": _l('graphdb id [graphdb_id] not exists'),  # "图数据库id [graphdb_id] 不存在",
        "solution": _l('please config your graphdb again.')  # "请重新配置图数据库"
    },
    'Builder.GraphService.GetGraphInfoBasic.PermissionError': {
        "errorcode": "Builder.GraphService.GetGraphInfoBasic.PermissionError",
        "description": "[description]",
        "cause": "[cause]",
        "solution": "[solution]"
    },
    'Builder.GraphService.GetGraphInfoBasic.UnsupportedKeyExist': {
        "errorcode": "Builder.GraphService.GetGraphInfoBasic.UnsupportedKeyExist",
        "description": _l('these keys are not supported: [unsupported_key]'),  # "这些字段不支持: [unsupported_key]",
        "cause": _l('some keys are not supported.'),  # "key中有不支持的字段",
        "solution": _l('please check your parameter key again.')  # "请检查传入的参数key"
    },
    'Builder.GraphController.GetGraphInfoOnto.ParamError': {
        "errorcode": "Builder.GraphController.GetGraphInfoOnto.ParamError",
        "description": "[description]",
        "cause": _l('argument [arg] error'),  # "参数[arg]错误",
        "solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.GetGraphInfoOnto.UnknownError': {
        "errorcode": "Builder.GraphController.GetGraphInfoOnto.UnknownError",
        "description": "[description]",
        "cause": _l("[cause]"),
        "solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.GetGraphInfoOnto.GraphidNotExist': {
        "errorcode": "Builder.GraphService.GetGraphInfoOnto.GraphidNotExist",
        "description": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "cause": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphService.GetGraphInfoOnto.OtlidNotExist': {
        "errorcode": "Builder.GraphService.GetGraphInfoOnto.OtlidNotExist",
        "description": _l('ontology id [otl_id] not exists'),
        "cause": _l('ontology id [otl_id] not exists'),
        "solution": _l("Please config the ontology.")
    },
    'Builder.GraphController.GetGraphInfoCount.ParamError': {
        "errorcode": "Builder.GraphController.GetGraphInfoCount.ParamError",
        "description": "[description]",
        "cause": _l('argument [arg] error'),  # "参数[arg]错误",
        "solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.GetGraphInfoCount.UnknownError': {
        "errorcode": "Builder.GraphController.GetGraphInfoCount.UnknownError",
        "description": "[description]",
        "cause": _l("[cause]"),
        "solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.GetGraphInfoCount.GraphidNotExist': {
        "errorcode": "Builder.GraphService.GetGraphInfoCount.GraphidNotExist",
        "description": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "cause": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.GetGraphInfoDetail.ParamError': {
        "errorcode": "Builder.GraphController.GetGraphInfoDetail.ParamError",
        "description": "[description]",
        "cause": _l('argument [arg] error'),  # "参数[arg]错误",
        "solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.GetGraphInfoDetail.UnknownError': {
        "errorcode": "Builder.GraphController.GetGraphInfoDetail.UnknownError",
        "description": "[description]",
        "cause": _l("[cause]"),
        "solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.GetGraphInfoDetail.GraphidNotExist': {
        "errorcode": "Builder.GraphService.GetGraphInfoDetail.GraphidNotExist",
        "description": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "cause": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphService.GetGraphInfoDetail.NameNotExist': {
        "errorcode": "Builder.GraphService.GetGraphInfoDetail.NameNotExist",
        "description": _l('[class_type] [name] not exists'),
        "cause": _l('[class_type] [name] not exists'),
        "solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
}
