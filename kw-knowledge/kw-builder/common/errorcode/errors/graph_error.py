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

    'Builder.GraphController.GetGraphByStep.ParamError': {
        "ErrorCode": 'Builder.GraphController.GetGraphByStep.ParamError',
        "Description": _l("The parameter graph_id type must be int!"),
        "ErrorDetails": _l("The parameter graph_id type must be int!"),
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.GraphController.GetGraphByStep.UnknownError': {
        "ErrorCode": 'Builder.GraphController.GetGraphByStep.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.GraphController.GetGraphInfoExt.ParamError': {
        "ErrorCode": 'Builder.GraphController.GetGraphInfoExt.ParamError',
        "Description": "[message]",
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GetGraphInfoExt.UnknownError': {
        "ErrorCode": 'Builder.GraphController.GetGraphInfoExt.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.GetGraphInfoExt.GraphIdNotExist': {
        "ErrorCode": 'Builder.GraphService.GetGraphInfoExt.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
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

    'Builder.GraphController.SubgraphSaveNoCheck.ParamError': {
        "ErrorCode": 'Builder.GraphController.SubgraphSaveNoCheck.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.SubgraphSaveNoCheck.GraphIdNotExist': {
        "ErrorCode": 'Builder.GraphController.SubgraphSaveNoCheck.GraphIdNotExist',
        "Description": _l('graph id [graph_id] not exists'),
        "ErrorDetails": _l('graph id [graph_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.SubgraphSaveNoCheck.UnknownError': {
        "ErrorCode": 'Builder.GraphController.SubgraphSaveNoCheck.UnknownError',
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
    'Builder.GraphController.GraphDeleteByids.CheckKnwError': {
        "ErrorCode": 'Builder.GraphController.GraphDeleteByids.CheckKnwError',
        "Description": '[des]',
        "ErrorDetails": '[des]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GraphDeleteByids.GraphIdNotExist': {
        "ErrorCode": 'Builder.GraphController.GraphDeleteByids.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
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
        "Solution": _l("Please check whether you have permission to delete or whther the graph is running.")
        # 请检查是否有删除权限或者图谱是否在运行中
    },

    'Builder.GraphController.SwitchToBeUploaded.ParamError': {
        "ErrorCode": 'Builder.GraphController.SwitchToBeUploaded.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.SwitchToBeUploaded.UnknownError': {
        "ErrorCode": 'Builder.GraphController.SwitchToBeUploaded.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.SwitchToBeUploaded.ECephUnavailable': {
        "ErrorCode": 'Builder.GraphService.SwitchToBeUploaded.ECephUnavailable',
        "Description": _l(
            'Eceph not connected, upload function cannot be opened now, please contact the System OP Admin to configure it'),
        "ErrorDetails": _l(
            'Eceph not connected, upload function cannot be opened now, please contact the System OP Admin to configure it'),
        "Solution": _l("Please config ECeph again.")
    },
    'Builder.GraphService.SwitchToBeUploaded.GraphIdNotExist': {
        "ErrorCode": 'Builder.GraphService.SwitchToBeUploaded.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.SwitchToBeUploaded.GraphRunning': {
        "ErrorCode": 'Builder.GraphService.SwitchToBeUploaded.GraphRunning',
        "Description": _l("graph_id [graph_id] is running or waiting. "),
        "ErrorDetails": _l("graph_id [graph_id] is running or waiting. "),
        "Solution": _l("Please wait until the task finishes. ")
    },

    'Builder.GraphController.IsExportable.ParamError': {
        "ErrorCode": 'Builder.GraphController.IsExportable.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.IsExportable.UnknownError': {
        "ErrorCode": 'Builder.GraphController.IsExportable.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.GraphDsList.ParamError': {
        "ErrorCode": 'Builder.GraphController.GraphDsList.ParamError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GraphDsList.GetDsByGraphIdError': {
        "ErrorCode": 'Builder.GraphController.GraphDsList.GetDsByGraphIdError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.GraphDsList.GetDsAllError': {
        "ErrorCode": 'Builder.GraphController.GraphDsList.GetDsAllError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.GetGraphById.ParamError': {
        "ErrorCode": 'Builder.GraphController.GetGraphById.ParamError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GetGraphById.CheckByIdError': {
        "ErrorCode": 'Builder.GraphController.GetGraphById.CheckByIdError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.GetGraphById.GetGraphByIdError': {
        "ErrorCode": 'Builder.GraphController.GetGraphById.GetGraphByIdError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.GraphController.CreateGraphSpace.ParamError': {
        "ErrorCode": 'Builder.GraphController.CreateGraphSpace.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.CreateGraphSpace.UnknownError': {
        "ErrorCode": 'Builder.GraphController.CreateGraphSpace.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.CreateGraphSpace.GraphIdNotExist': {
        "ErrorCode": 'Builder.GraphService.CreateGraphSpace.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.CreateGraphSpace.NebulaError': {
        "ErrorCode": "Builder.GraphService.CreateGraphSpace.NebulaError",
        "Description": _l('Nebula has some error.'),
        "ErrorDetails": '[message]',
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.CreateGraphSpace.GraphRunning': {
        "ErrorCode": 'Builder.GraphService.CreateGraphSpace.GraphRunning',
        "Description": _l("graph is running or waiting."),
        "ErrorDetails": _l("graph is running or waiting."),
        "Solution": _l("Please wait until the task finishes. ")
    },

    'Builder.GraphController.CreateSchema.ParamError': {
        "ErrorCode": 'Builder.GraphController.CreateSchema.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.CreateSchema.UnknownError': {
        "ErrorCode": 'Builder.GraphController.CreateSchema.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.CreateSchema.GraphIdNotExist': {
        "ErrorCode": 'Builder.GraphService.CreateSchema.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.CreateSchema.OtlNotExist': {
        "ErrorCode": "Builder.GraphService.CreateSchema.OtlNotExist",
        "Description": _l('ontology not exists'),
        "ErrorDetails": _l('ontology not exists'),
        "Solution": _l("Please config the ontology.")
    },
    'Builder.GraphService.CreateSchema.NebulaError': {
        "ErrorCode": "Builder.GraphService.CreateSchema.NebulaError",
        "Description": _l('Nebula has some error.'),
        "ErrorDetails": '[message]',
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.CreateSchema.SpaceNotFound': {
        "ErrorCode": "Builder.GraphService.CreateSchema.SpaceNotFound",
        "Description": _l('Nebula space has not been created yet.'),
        "ErrorDetails": _l('Nebula space has not been created yet.'),
        "Solution": _l("Please wait for 20 seconds and try again.")
    },
    'Builder.GraphService.CreateSchema.OpensearchError': {
        "ErrorCode": "Builder.GraphService.CreateSchema.OpensearchError",
        "Description": _l('Opensearch has some error.'),
        "ErrorDetails": '[message]',
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.CreateSchema.GraphRunning': {
        "ErrorCode": 'Builder.GraphService.CreateSchema.GraphRunning',
        "Description": _l("graph is running or waiting."),
        "ErrorDetails": _l("graph is running or waiting."),
        "Solution": _l("Please wait until the task finishes. ")
    },

    'Builder.GraphController.AlterGraphData.ParamError': {
        "ErrorCode": 'Builder.GraphController.AlterGraphData.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.AlterGraphData.UnknownError': {
        "ErrorCode": 'Builder.GraphController.AlterGraphData.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.AlterGraphData.GraphIdNotExist': {
        "ErrorCode": 'Builder.GraphService.AlterGraphData.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.AlterGraphData.OtlNotExist': {
        "ErrorCode": "Builder.GraphService.AlterGraphData.OtlNotExist",
        "Description": _l('ontology not exists'),
        "ErrorDetails": _l('ontology not exists'),
        "Solution": _l("Please config the ontology.")
    },
    'Builder.GraphService.AlterGraphData.MissingMergeProperty': {
        "ErrorCode": 'Builder.GraphService.AlterGraphData.MissingMergeProperty',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.AlterGraphData.DataTypeError': {
        "ErrorCode": 'Builder.GraphService.AlterGraphData.DataTypeError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.AlterGraphData.NameNotExists': {
        "ErrorCode": 'Builder.GraphService.AlterGraphData.NameNotExists',
        "Description": _l("[name] not exist!"),
        "ErrorDetails": _l("[name] not exist!"),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.AlterGraphData.SchemaCreationFailed': {
        "ErrorCode": 'Builder.GraphService.AlterGraphData.SchemaCreationFailed',
        "Description": _l("schema creation failed."),
        "ErrorDetails": _l("schema creation failed."),
        "Solution": _l("Please create schema again.")
    },
    'Builder.GraphService.AlterGraphData.ExtraProperty': {
        "ErrorCode": 'Builder.GraphService.AlterGraphData.ExtraProperty',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.AlterGraphData.NebulaError': {
        "ErrorCode": "Builder.GraphService.AlterGraphData.NebulaError",
        "Description": _l('Nebula has some error.'),
        "ErrorDetails": '[message]',
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.AlterGraphData.RelationNotExists': {
        "ErrorCode": 'Builder.GraphService.AlterGraphData.RelationNotExists',
        "Description": _l("the relation of start_entity, edge_name and end_entity is inconsistent with the ontology"),
        "ErrorDetails": _l("the relation of start_entity, edge_name and end_entity is inconsistent with the ontology"),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.AlterGraphData.GraphRunning': {
        "ErrorCode": 'Builder.GraphService.AlterGraphData.GraphRunning',
        "Description": _l("graph is running or waiting."),
        "ErrorDetails": _l("graph is running or waiting."),
        "Solution": _l("Please wait until the task finishes. ")
    },
    'Builder.GraphDao.RefreshRedisCache.RedisWriteError': {
        "ErrorCode": 'Builder.GraphDao.RefreshRedisCache.RedisWriteError',
        "Description": _l("Redis cache write failed."),
        "ErrorDetails": _l("Redis cache write failed."),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphDao.FindRedisGraphCache.RedisReadError': {
        "ErrorCode": 'Builder.GraphDao.FindRedisGraphCache.RedisReadError',
        "Description": _l("Redis cache read failed."),
        "ErrorDetails": _l("Redis cache read failed."),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphController.BatchDelRelation.ParamError': {
        "ErrorCode": 'Builder.GraphController.BatchDelRelation.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphController.BatchDelRelation.UnknownError': {
        "ErrorCode": 'Builder.GraphController.BatchDelRelation.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.BatchDelRelation.GraphIdNotExist': {
        "ErrorCode": 'Builder.GraphService.BatchDelRelation.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.BatchDelRelation.VertexNameNotExists': {
        "ErrorCode": 'Builder.GraphService.BatchDelRelation.VertexNameNotExists',
        "Description": _l("vertex name not exists."),
        "ErrorDetails": _l("vertex name not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.BatchDelRelation.RelationNameNotExists': {
        "ErrorCode": 'Builder.GraphService.BatchDelRelation.RelationNameNotExists',
        "Description": _l("relation name not exists."),
        "ErrorDetails": _l("relation name not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.BatchDelRelation.NebulaError': {
        "ErrorCode": "Builder.GraphService.BatchDelRelation.NebulaError",
        "Description": _l('Nebula has some error.'),
        "ErrorDetails": '[message]',
        "Solution": _l("Please contact the developers.")
    },
    'Builder.GraphService.BatchDelRelation.DeleteError': {
        "ErrorCode": "Builder.GraphService.BatchDelRelation.DeleteError",
        "Description": _l("An error occurred in Nebula while deleting."),
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check Nebula service status.")
    },
    'Builder.GraphService.BatchDelRelation.GraphRunning': {
        "ErrorCode": 'Builder.GraphService.BatchDelRelation.GraphRunning',
        "Description": _l("graph is running or waiting."),
        "ErrorDetails": _l("graph is running or waiting."),
        "Solution": _l("Please wait until the task finishes. ")
    },
    'Builder.GraphService.BatchDelRelation.MissingMergeProperty': {
        "ErrorCode": 'Builder.GraphService.BatchDelRelation.MissingMergeProperty',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.GraphService.GraphInput.GraphIdNotExist': {
        "ErrorCode": "Builder.GraphService.GraphInput.GraphIdNotExist",
        "Description": _l("graphid [graphid] not exists."),
        "ErrorDetails": _l("graphid [graphid] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.GraphInput.GraphNotExistInKnw': {
        "ErrorCode": "Builder.GraphService.GraphInput.GraphNotExistInKnw",
        "Description": _l('The knowledge network does not match the graph!'),
        "ErrorDetails": _l('The knowledge network does not match the graph!'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.GraphService.GraphInput.PermissionError': {
        "ErrorCode": "Builder.GraphService.GraphInput.PermissionError",
        "Description": "No permissions for graph [graph_id].",
        "ErrorDetails": "No permissions for graph [graph_id].",
        "Solution": _l("Please check your parameter again.")
    },

}
