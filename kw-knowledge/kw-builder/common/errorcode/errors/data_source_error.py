# -*- coding:utf-8 -*-
from flask_babel import gettext as _l


errDict = {
    'Builder.DsmController.ConnectTest.ParametersError': {
        "ErrorCode": "Builder.DsmController.ConnectTest.ParametersError",
        "Description": "[description]",
        "ErrorDetails": "[description]",
        "Solution": _l("Please check your parameter again.")  # 请重新检查输入参数
    },
    'Builder.BuilderApp.BeforeRequest.ParametersError': {
        "ErrorCode": "Builder.BuilderApp.BeforeRequest.ParametersError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.DsmController.TableField.ParamError': {
        "ErrorCode": "Builder.DsmController.TableField.ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.DsmController.TableField.UnknownError': {
        "ErrorCode": "Builder.DsmController.TableField.UnknownError",
        "Description": "[cause]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.DsmService.TableField.DsIdNotExist': {
        "ErrorCode": "Builder.DsmService.TableField.DsIdNotExist",
        "Description": _l("ds_id [ds_id] not exists."),
        "ErrorDetails": _l("ds_id [ds_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.dsmService.TableField.NoPermissionError': {
        "ErrorCode": "Builder.dsmService.TableField.NoPermissionError",
        "Description": _l("No permissions for ds_id [ds_id]."),
        "ErrorDetails": _l("No permissions for ds_id [ds_id]."),
        "Solution": _l('please check your data source again.')
    },
    'Builder.DsmService.TableField.DsNotMatch': {
        "ErrorCode": "Builder.DsmService.TableField.DsNotMatch",
        "Description": _l("data source doesn't match."),
        "ErrorDetails": _l("data source doesn't match."),
        "Solution": _l('please check your data source again.')
    },
    'Builder.DsmService.TableField.GetTableFieldError': {
        "ErrorCode": "Builder.DsmService.TableField.GetTableFieldError",
        "Description": _l("Failed to get database table structure. "),
        "ErrorDetails": "[cause]",
        "Solution": _l('please check your data source again.')
    },
    'Builder.DsmService.TableField.PasswordError': {
        "ErrorCode": "Builder.DsmService.TableField.PasswordError",
        "Description": "[cause]",
        "ErrorDetails": "[cause]",
        "Solution": _l('please check your data source again.')
    },

    'Builder.DsmController.DsSql.ParamError': {
        "ErrorCode": "Builder.DsmController.DsSql.ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l('please check your data source again.')
    },
    'Builder.DsmController.DsSql.UnknownError': {
        "ErrorCode": "Builder.DsmController.DsSql.UnknownError",
        "Description": "[cause]",
        "ErrorDetails": "[cause]",
        "Solution": _l('please check your data source again.')
    },

    'Builder.DsmService.DsSql.DsIdNotExist': {
        "ErrorCode": "Builder.DsmService.DsSql.DsIdNotExist",
        "Description": _l("ds_id [ds_id] not exists."),
        "ErrorDetails": _l("ds_id [ds_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.dsmService.DsSql.NoPermissionError': {
        "ErrorCode": "Builder.dsmService.DsSql.NoPermissionError",
        "Description": _l("No permissions for ds_id [ds_id]."),
        "ErrorDetails": _l("No permissions for ds_id [ds_id]."),
        "Solution": _l('please check your data source again.')
    },
    'Builder.DsmService.DsSql.DataSourceError': {
        "ErrorCode": "Builder.DsmService.DsSql.DataSourceError",
        "Description": _l("Data source type [data_source] does not support SQL statement. "),
        "ErrorDetails": _l("Data source type [data_source] does not support SQL statement. "),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.DsmService.DsSql.SqlError': {
        "ErrorCode": "Builder.DsmService.DsSql.SqlError",
        "Description": _l("SQL statement execution error, please check your SQL statement. "),
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.DsmService.DsSql.TimeOutError': {
        "ErrorCode": "Builder.DsmService.DsSql.TimeOutError",
        "Description": _l("SQL statement execution timeout, please optimise your SQL statement. "),
        "ErrorDetails": _l("SQL statement execution timeout, please optimise your SQL statement. "),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.DsmService.DsSql.PasswordError': {
        "ErrorCode": "Builder.DsmService.DsSql.PasswordError",
        "Description": "[cause]",
        "ErrorDetails": "[cause]",
        "Solution": _l('please check your data source again.')
    },

    'Builder.DsmController.PreviewData.ParamError': {
        "ErrorCode": "Builder.DsmController.PreviewData.ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.DsmController.PreviewData.UnknownError': {
        "ErrorCode": "Builder.DsmController.PreviewData.UnknownError",
        "Description": "[cause]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.DsmService.PreviewData.DsIdNotExist': {
        "ErrorCode": "Builder.DsmService.PreviewData.DsIdNotExist",
        "Description": _l("ds_id [ds_id] not exists."),
        "ErrorDetails": _l("ds_id [ds_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.dsmService.PreviewData.NoPermissionError': {
        "ErrorCode": "Builder.dsmService.PreviewData.NoPermissionError",
        "Description": _l("No permissions for ds_id [ds_id]."),
        "ErrorDetails": _l("No permissions for ds_id [ds_id]."),
        "Solution": _l('please check your data source again.')
    },
    'Builder.DsmService.PreviewData.DsNotMatch': {
        "ErrorCode": "Builder.DsmService.PreviewData.DsNotMatch",
        "Description": _l("data source doesn't match."),
        "ErrorDetails": _l("data source doesn't match."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.PreviewData.PreviewError': {
        "ErrorCode": "Builder.OtlService.PreviewData.PreviewError",
        "Description": _l("Failed to preview data. "),
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.DsmService.PreviewData.PasswordError': {
        "ErrorCode": "Builder.DsmService.PreviewData.PasswordError",
        "Description": "[cause]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.DsmService.GetById.DsIdNotExists': {
        "ErrorCode": "Builder.DsmService.GetById.DsIdNotExists",
        "Description": _l("ds_id [ds_id] not exists."),
        "ErrorDetails": _l("ds_id [ds_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder_DsmController_GetById_ParamError': {
        "ErrorCode": "Builder_DsmController_GetById_ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.DsmController.GetById.UnknownError': {
        "ErrorCode": "Builder.DsmController.GetById.UnknownError",
        "Description": "[cause]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.dsmService.Update.NoPermissionError': {
        "ErrorCode": "Builder.dsmService.Update.NoPermissionError",
        "Description": _l("No permissions for ds_id [ds_id]."),
        "ErrorDetails": _l("No permissions for ds_id [ds_id]."),
        "Solution": _l('please check your data source again.')
    },

}
