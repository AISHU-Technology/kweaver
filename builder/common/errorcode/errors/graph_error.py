# -*- coding:utf-8 -*-
from flask_babel import gettext as _l

errDict = {
    'Builder.GraphController.GetGraphInfoBasic.ParamError': {
        "ErrorCode": "Builder.GraphController.GetGraphInfoBasic.ParamError",
        "Description": "[description]",
        "ErrorDetails": _l("Parameter [arg] Error."),  # 参数[arg]错误
        "Solution": _l("Please check your parameter again.")  # 请重新检查输入参数
    },
    'Builder.GraphController.GetGraphInfoBasic.UnknownError': {
        "ErrorCode": "Builder.GraphController.GetGraphInfoBasic.UnknownError",
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.GetGraphInfoBasic.GraphidNotExist': {
        "ErrorCode": "Builder.GraphService.GetGraphInfoBasic.GraphidNotExist",
        "Description": _l("graphid [graphid] not exists."),
        "ErrorDetails": _l("graphid [graphid] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GetGraphInfoBasic.KeyTypeError': {
        "ErrorCode": "Builder.GraphController.GetGraphInfoBasic.KeyTypeError",
        "Description": _l('key type error'),  # "key类型错误",
        "ErrorDetails": _l('key should be list of string'),  # "key应为字符串列表",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphService.GetGraphInfoBasic.GraphDBIdNotExist': {
        "ErrorCode": "Builder.GraphService.GetGraphInfoBasic.GraphDBIdNotExist",
        "Description": _l('graphdb id [graphdb_id] not exists'),  # "图数据库id [graphdb_id] 不存在",
        "ErrorDetails": _l('graphdb id [graphdb_id] not exists'),  # "图数据库id [graphdb_id] 不存在",
        "Solution": _l('please config your graphdb again.')  # "请重新配置图数据库"
    },
    'Builder.GraphService.GetGraphInfoBasic.PermissionError': {
        "ErrorCode": "Builder.GraphService.GetGraphInfoBasic.PermissionError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": "[solution]"
    },
    'Builder.GraphService.GetGraphInfoBasic.UnsupportedKeyExist': {
        "ErrorCode": "Builder.GraphService.GetGraphInfoBasic.UnsupportedKeyExist",
        "Description": _l('these keys are not supported: [unsupported_key]'),  # "这些字段不支持: [unsupported_key]",
        "ErrorDetails": _l('some keys are not supported.'),  # "key中有不支持的字段",
        "Solution": _l('please check your parameter key again.')  # "请检查传入的参数key"
    },
    'Builder.GraphController.GetGraphInfoOnto.ParamError': {
        "ErrorCode": "Builder.GraphController.GetGraphInfoOnto.ParamError",
        "Description": "[description]",
        "ErrorDetails": _l('argument [arg] error'),  # "参数[arg]错误",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.GetGraphInfoOnto.UnknownError': {
        "ErrorCode": "Builder.GraphController.GetGraphInfoOnto.UnknownError",
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.GetGraphInfoOnto.GraphidNotExist': {
        "ErrorCode": "Builder.GraphService.GetGraphInfoOnto.GraphidNotExist",
        "Description": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "ErrorDetails": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphService.GetGraphInfoOnto.OtlidNotExist': {
        "ErrorCode": "Builder.GraphService.GetGraphInfoOnto.OtlidNotExist",
        "Description": _l('ontology id [otl_id] not exists'),
        "ErrorDetails": _l('ontology id [otl_id] not exists'),
        "Solution": _l("Please config the ontology.")
    },
    'Builder.GraphController.GetGraphInfoCount.ParamError': {
        "ErrorCode": "Builder.GraphController.GetGraphInfoCount.ParamError",
        "Description": "[description]",
        "ErrorDetails": _l('argument [arg] error'),  # "参数[arg]错误",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.GetGraphInfoCount.UnknownError': {
        "ErrorCode": "Builder.GraphController.GetGraphInfoCount.UnknownError",
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.GetGraphInfoCount.GraphidNotExist': {
        "ErrorCode": "Builder.GraphService.GetGraphInfoCount.GraphidNotExist",
        "Description": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "ErrorDetails": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.GetGraphInfoDetail.ParamError': {
        "ErrorCode": "Builder.GraphController.GetGraphInfoDetail.ParamError",
        "Description": "[description]",
        "ErrorDetails": _l('argument [arg] error'),  # "参数[arg]错误",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.GetGraphInfoDetail.UnknownError': {
        "ErrorCode": "Builder.GraphController.GetGraphInfoDetail.UnknownError",
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.GetGraphInfoDetail.GraphidNotExist': {
        "ErrorCode": "Builder.GraphService.GetGraphInfoDetail.GraphidNotExist",
        "Description": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "ErrorDetails": _l('graph id [graphid] not exists'),  # "graphid [graphid] 不存在",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphService.GetGraphInfoDetail.NameNotExist': {
        "ErrorCode": "Builder.GraphService.GetGraphInfoDetail.NameNotExist",
        "Description": _l('[class_type] [name] not exists'),
        "ErrorDetails": _l('[class_type] [name] not exists'),
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.IntelligenceCalculateTask.ParamError': {
        "ErrorCode": "Builder.GraphController.IntelligenceCalculateTask.ParamError",
        "Description": _l("Parameter [arg] Error."),
        "ErrorDetails": _l("parameter [arg] not exists or invalid"),
        "Solution": _l("please ensure parameter [arg] exists and valid")
    },
    'Builder.GraphController.IntelligenceCalculateTask.GraphStatusQueryError': {
        "ErrorCode": "Builder.GraphController.IntelligenceCalculateTask.GraphStatusQueryError",
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    "Builder.GraphController.IntelligenceStats.ParamError": {
        "ErrorCode": "Builder.GraphController.IntelligenceStats.ParamError",
        "Description": _l("Parameter [arg] Error."),
        "ErrorDetails": _l("parameter [arg] not exists or invalid"),
        "Solution": _l("please ensure parameter [arg] exists and valid")
    },
    "Builder.KnowledgeNetworkController.IntelligenceStats.ParamError": {
        "ErrorCode": "Builder.KnowledgeNetworkController.IntelligenceStats.ParamError",
        "Description": _l("Parameter [arg] Error."),
        "ErrorDetails": _l("parameter [arg] not exists or invalid"),
        "Solution": _l("please ensure parameter [arg] exists and valid")
    },
    'Builder.KnowledgeNetworkController.IntelligenceStats.ParamTooBigError': {
        "ErrorCode": "Builder.KnowledgeNetworkController.IntelligenceStats.ParamTooBigError",
        "Description": _l("Parameter [arg] too big please lower than [max]"),
        "ErrorDetails": _l("Parameter [arg] too big please lower than [max]"),
        "Solution": _l("please ensure parameter [arg] exists and valid")
    },
    'Builder.KnowledgeNetworkController.IntelligenceStats.QueryError': {
        "ErrorCode": "Builder.KnowledgeNetworkController.IntelligenceStats.QueryError",
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    "Builder.KnowledgeNetworkController.IntelligenceStats.NotAllowedParamError": {
        "ErrorCode": "Builder.KnowledgeNetworkController.IntelligenceStats.NotAllowedParamError",
        "Description": _l("Parameter [arg] not allow, please choose [allowed]"),
        "ErrorDetails": _l("Parameter [arg] not allow, please choose [allowed]"),
        "Solution": _l("please ensure parameter [arg] exists and valid")
    },
    'Builder.GraphController.CreateSubgraphConfig.ParamError': {
        "ErrorCode": "Builder.GraphController.CreateSubgraphConfig.ParamError",
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.CreateSubgraphConfig.UnknownError': {
        "ErrorCode": 'Builder.GraphController.CreateSubgraphConfig.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.EditSubgraphConfig.ParamError': {
        "ErrorCode": 'Builder.GraphController.EditSubgraphConfig.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.EditSubgraphConfig.GraphIdNotExist': {
        "ErrorCode": 'Builder.GraphController.EditSubgraphConfig.GraphIdNotExist',
        "Description": _l('graph id [graph_id] not exists'),
        "ErrorDetails": _l('graph id [graph_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.EditSubgraphConfig.UnknownError': {
        "ErrorCode": 'Builder.GraphController.EditSubgraphConfig.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.GetSubgraphList.ParamError': {
        "ErrorCode": 'Builder.GraphController.GetSubgraphList.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GetSubgraphList.UnknownError': {
        "ErrorCode": 'Builder.GraphController.GetSubgraphList.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.GetSubgraphConfig.ParamError': {
        "ErrorCode": 'Builder.GraphController.GetSubgraphConfig.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GetSubgraphConfig.UnknownError': {
        "ErrorCode": 'Builder.GraphController.GetSubgraphConfig.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.DeleteSubgraphConfig.ParamError': {
        "ErrorCode": 'Builder.GraphController.DeleteSubgraphConfig.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder_GraphController.DeleteSubgraphConfig.UnknownError': {
        "ErrorCode": 'Builder_GraphController.DeleteSubgraphConfig.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.GraphDeleteByids.ParamError': {
        "ErrorCode": 'Builder.GraphController.GraphDeleteByids.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GraphDeleteByids.KnwIdNotExist': {
        "ErrorCode": 'Builder.GraphController.GraphDeleteByids.KnwIdNotExist',
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GraphDeleteByIds.UnknownError': {
        "ErrorCode": 'Builder.GraphController.GraphDeleteByIds.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.GraphDeleteByIds.DeleteFail': {
        "ErrorCode": 'Builder.GraphController.GraphDeleteByIds.DeleteFail',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether you have permission to delete or whther the graph is running.")  # 请检查是否有删除权限或者图谱是否在运行中
    },

}
