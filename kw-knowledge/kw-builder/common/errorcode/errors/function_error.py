# -*- coding:utf-8 -*-

from flask_babel import gettext as _l

errDict = {
    'Builder.FunctionController.CreateFunction.UnknownError': {
        "ErrorCode": 'Builder.FunctionController.CreateFunction.UnknownError',
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.FunctionController.CreateFunction.ParamError': {
        "ErrorCode": 'Builder.FunctionController.CreateFunction.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.FunctionService.CreateFunction.KnwIdNotExist': {
        "ErrorCode": 'Builder.FunctionService.CreateFunction.KnwIdNotExist',
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.FunctionService.CreateFunction.DuplicatedName": {
        "ErrorCode": "Builder.FunctionService.CreateFunction.DuplicatedName",
        "Description": _l("Duplicate function name"),
        "ErrorDetails": _l("Function name [name] already exists and cannot be created repeatedly."),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.FunctionController.EditFunction.UnknownError': {
        "ErrorCode": 'Builder.FunctionController.EditFunction.UnknownError',
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.FunctionController.EditFunction.ParamError': {
        "ErrorCode": 'Builder.FunctionController.EditFunction.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.FunctionService.EditFunction.FunctionIdNotExist': {
        "ErrorCode": 'Builder.FunctionService.EditFunction.FunctionIdNotExist',
        "Description": _l('function id [function_id] not exists'),
        "ErrorDetails": _l('function id [function_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.FunctionService.EditFunction.KnwIdNotExist': {
        "ErrorCode": 'Builder.FunctionService.EditFunction.KnwIdNotExist',
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.FunctionService.EditFunction.DuplicatedName": {
        "ErrorCode": "Builder.FunctionService.EditFunction.DuplicatedName",
        "Description": _l("Duplicate function name"),
        "ErrorDetails": _l("Function name [name] already exists and cannot be created repeatedly."),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.FunctionController.DeleteFunction.UnknownError': {
        "ErrorCode": 'Builder.FunctionController.DeleteFunction.UnknownError',
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.FunctionController.DeleteFunction.ParamError': {
        "ErrorCode": 'Builder.FunctionController.DeleteFunction.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.FunctionController.GetFunctionList.UnknownError': {
        "ErrorCode": 'Builder.FunctionController.GetFunctionList.UnknownError',
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.FunctionController.GetFunctionList.ParamError': {
        "ErrorCode": 'Builder.FunctionController.GetFunctionList.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.FunctionService.GetFunctionList.KnwIdNotExist': {
        "ErrorCode": 'Builder.FunctionService.GetFunctionList.KnwIdNotExist',
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.FunctionController.GetFunctionById.UnknownError': {
        "ErrorCode": 'Builder.FunctionController.GetFunctionById.UnknownError',
        "Description": "[description]",
        "ErrorDetails": _l("[cause]"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.FunctionController.GetFunctionById.ParamError': {
        "ErrorCode": 'Builder.FunctionController.GetFunctionById.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.FunctionService.GetFunctionById.FunctionIdNotExist': {
        "ErrorCode": 'Builder.FunctionService.GetFunctionById.FunctionIdNotExist',
        "Description": _l('function id [function_id] not exists'),
        "ErrorDetails": _l('function id [function_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
}
