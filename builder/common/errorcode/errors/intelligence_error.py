# -*- coding:utf-8 -*-
from flask_babel import gettext as _l

errDict = {
    'Builder.Dao.AsyncTaskDao.Update.ServerError': {
        "ErrorCode": "Builder.Dao.AsyncTaskDao.Update.ServerError",
        "Description": "Server Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.Dao.AsyncTaskDao.Update.SQLSyntaxError': {
        "ErrorCode": "Builder.Dao.AsyncTaskDao.Update.SQLSyntaxError",
        "Description": "SQL Syntax Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.IntelligenceCalculateService.SendTask.GraphWaitStatusError': {
        "ErrorCode": "Builder.IntelligenceCalculateService.SendTask.GraphWaitStatusError",
        "Description": _l("knowledge graph is waiting build, please calculate after building"),
        "ErrorDetails": _l("knowledge graph is waiting build, please calculate after building"),
        "Solution": _l("Please check graph status")
    },
    'Builder.IntelligenceCalculateService.SendTask.GraphRunStatusError': {
        "ErrorCode": "Builder.IntelligenceCalculateService.SendTask.GraphRunStatusError",
        "Description": _l("knowledge graph is building, please calculate after building"),
        "ErrorDetails": _l("knowledge graph is building, please calculate after building"),
        "Solution": _l("Please check graph status")
    },
    'Builder.IntelligenceCalculateService.SendTask.GraphConfigStatusError': {
        "ErrorCode": "Builder.IntelligenceCalculateService.SendTask.GraphConfigStatusError",
        "Description": _l("knowledge graph is configuring build, please calculate after building"),
        "ErrorDetails": _l("knowledge graph is configuring build, please calculate after building"),
        "Solution": _l("Please check graph status")
    },
    'Builder.IntelligenceCalculateService.SendTask.GraphFailStatusError': {
        "ErrorCode": "Builder.IntelligenceCalculateService.SendTask.GraphFailStatusError",
        "Description": _l(
            "knowledge graph store in NebulaGraph, if you need intelligence score, please calculate after building successfully"),
        "ErrorDetails": _l(
            "knowledge graph store in NebulaGraph, if you need intelligence score, please calculate after building successfully"),
        "Solution": _l("Please check graph status")
    },
    'Builder.IntelligenceCalculateService.SendTask.CallAsyncTaskError': {
        "ErrorCode": "Builder.IntelligenceCalculateService.SendTask.CallAsyncTaskError",
        "Description": _l("call async task service error"),
        "ErrorDetails": _l("[detail]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.IntelligenceCalculateService.SendTask.AsyncTaskInternalError': {
        "ErrorCode": "Builder.IntelligenceCalculateService.SendTask.AsyncTaskInternalError",
        "Description": _l("async task service internal error"),
        "ErrorDetails": _l("[detail]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.IntelligenceQueryService.QueryGraphIntelligence.QueryError': {
        "ErrorCode": "Builder.IntelligenceQueryService.QueryGraphIntelligence.QueryError",
        "Description": _l("graph intelligence info query error"),
        "ErrorDetails": _l("[detail]"),
        "Solution": _l("Please contact the developers.")
    },
    "Builder.IntelligenceQueryService.QueryNetworkIntelligence.QueryError": {
        "ErrorCode": "Builder.IntelligenceQueryService.QueryNetworkIntelligence.QueryError",
        "Description": _l("network intelligence info query error"),
        "ErrorDetails": _l("[detail]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.IntelligenceCalculateService.SendTask.GraphInvalidStatusError': {
        "ErrorCode": "Builder.IntelligenceCalculateService.SendTask.GraphInvalidStatusError",
        "Description": _l("knowledge graph status invalid, please calculate after building successfully"),
        "ErrorDetails": _l("knowledge graph status invalid, please calculate after building successfully"),
        "Solution": _l("Please check graph status")
    },
}
