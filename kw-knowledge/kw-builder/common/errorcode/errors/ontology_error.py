# -*- coding:utf-8 -*-
from flask_babel import gettext as _l

errDict = {
    'Builder.OntologyController.PredictOntology.ParamError': {
        "ErrorCode": "Builder.OntologyController.PredictOntology.ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.PredictOntology.UnknownError': {
        "ErrorCode": 'Builder.OntologyController.PredictOntology.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OntologyController.PredictOntology.AsyncTaskInternalError': {
        "ErrorCode": 'Builder.OntologyController.PredictOntology.AsyncTaskInternalError',
        "Description": _l("send async task failed."),
        "ErrorDetails": _l("send async task failed."),
        "Solution": _l("Please contact the developers.")
    },

    'Builder.OtlService.PredictOntology.DataSourceInConsistent': {
        "ErrorCode": 'Builder.OtlService.PredictOntology.DataSourceInConsistent',
        "Description": _l("get extraction rules failed."),
        "ErrorDetails": _l("data_source in the parameter is inconsistent with that of the database."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.PredictOntology.GraphIdNotExist': {
        "ErrorCode": 'Builder.OtlService.PredictOntology.GraphIdNotExist',
        "Description": _l("get extraction rules failed."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.PredictOntology.DsIdNotExist': {
        "ErrorCode": 'Builder.OtlService.PredictOntology.DsIdNotExist',
        "Description": _l("get extraction rules failed."),
        "ErrorDetails": _l("ds_id [ds_id] not in the data source selected for the graph."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.PredictOntology.GetAnnotationOtlError': {
        "ErrorCode": 'Builder.OtlService.PredictOntology.GetAnnotationOtlError',
        "Description": "[message]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.PredictOntology.UnknownError': {
        "ErrorCode": 'Builder.OtlService.PredictOntology.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.PredictOntology.GetExtractionRulesFailed': {
        "ErrorCode": 'Builder.OtlService.PredictOntology.GetExtractionRulesFailed',
        "Description": _l("get extraction rules failed."),
        "ErrorDetails": "[cause]",
        "Solution": "[solution]"
    },

    'Builder.OntologyController.InfoExtractTask.ParamError': {
        "ErrorCode": 'Builder.OntologyController.InfoExtractTask.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.InfoExtractTask.UnknownError': {
        "ErrorCode": 'Builder.OntologyController.InfoExtractTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.OtlService.GetExtractTaskRes.CeleryTaskIdNotExist': {
        "ErrorCode": 'Builder.OtlService.GetExtractTaskRes.CeleryTaskIdNotExist',
        "Description": _l("get extract result failed."),
        "ErrorDetails": _l("the celery task id not exist."),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.OntologyController.DataPreview.ParamError': {
        "ErrorCode": 'Builder.OntologyController.DataPreview.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.DataPreview.UnknownError': {
        "ErrorCode": 'Builder.OntologyController.DataPreview.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OtlService.PreviewData.DsIdNotExist': {
        "ErrorCode": 'Builder.OtlService.PreviewData.DsIdNotExist',
        "Description": _l("preview data failed."),
        "ErrorDetails": _l("ds_id [ds_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.PreviewData.DataSourceInConsistent': {
        "ErrorCode": 'Builder.OtlService.PreviewData.DataSourceInConsistent',
        "Description": _l("preview data failed."),
        "ErrorDetails": _l("data_source in the parameter is inconsistent with that of the database."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.PreviewData.PreviewMysqlError': {
        "ErrorCode": 'Builder.OtlService.PreviewData.PreviewMysqlError',
        "Description": _l("preview mysql data failed."),
        "ErrorDetails": "[cause]",
        "Solution": "[solution]"
    },
    'Builder.OtlService.PreviewData.PreviewKingbaseesError': {
        "ErrorCode": 'Builder.OtlService.PreviewData.PreviewKingbaseesError',
        "Description": _l("preview kingbasees data failed."),
        "ErrorDetails": "[cause]",
        "Solution": "[solution]"
    },
    'Builder.OtlService.PreviewData.PreviewSqlServerError': {
        "ErrorCode": 'Builder.OtlService.PreviewData.PreviewSqlServerError',
        "Description": _l("preview sqlserver data failed."),
        "ErrorDetails": "[cause]",
        "Solution": "[solution]"
    },
    'Builder.OtlService.PreviewData.PreviewPostgreSQLError': {
        "ErrorCode": 'Builder.OtlService.PreviewData.PreviewPostgreSQLError',
        "Description": _l("preview postgresql data failed."),
        "ErrorDetails": "[cause]",
        "Solution": "[solution]"
    },
    'Builder.OtlService.PreviewData.PreviewClickHouseError': {
        "ErrorCode": 'Builder.OtlService.PreviewData.PreviewClickHouseError',
        "Description": _l("preview ClickHouse data failed."),
        "ErrorDetails": "[cause]",
        "Solution": "[solution]"
    },
    'Builder.OtlService.PreviewData.PasswordError': {
        "ErrorCode": 'Builder.OtlService.PreviewData.PasswordError',
        "Description": _l("preview data failed."),
        "ErrorDetails": "[cause]",
        "Solution": _l('please check your data source again.')
    },
    'Builder.OtlService.PreviewData.FileNotExist': {
        "ErrorCode": 'Builder.OtlService.PreviewData.FileNotExist',
        "Description": _l("preview data failed."),
        "ErrorDetails": "[cause]",
        "Solution": _l('Please check your parameter again.')
    },
    'Builder.OtlService.PreviewData.PreviewHiveError': {
        "ErrorCode": 'Builder.OtlService.PreviewData.PreviewHiveError',
        "Description": _l("preview hive data failed."),
        "ErrorDetails": "[cause]",
        "Solution": "[solution]"
    },
    'Builder.OtlService.PreviewData.UnsupportedFileType': {
        "ErrorCode": 'Builder.OtlService.PreviewData.UnsupportedFileType',
        "Description": _l("show anyshare file failed."),
        "ErrorDetails": _l("files of this type is not supported."),
        "Solution": _l("only csv or json files can be previewed.")
    },
    'Builder.OtlService.PreviewData.PreviewASError': {
        "ErrorCode": 'Builder.OtlService.PreviewData.PreviewASError',
        "Description": _l("preview anyshare data failed."),
        "ErrorDetails": "[cause]",
        "Solution": "[solution]"
    },

    'Builder.OntologyController.BuildOntoTask.ParamError': {
        "ErrorCode": 'Builder.OntologyController.BuildOntoTask.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.BuildOntoTask.UnknownError': {
        "ErrorCode": 'Builder.OntologyController.BuildOntoTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.OntoBlue.OtlTask.UnknownError': {
        "ErrorCode": 'Builder.OntoBlue.OtlTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OntoBlue.OtlTask.TaskNumberMaximum': {
        "ErrorCode": 'Builder.OntoBlue.OtlTask.TaskNumberMaximum',
        "Description": _l("add new task failed."),
        "ErrorDetails": _l("can't add new task because the number of task has reached the upper limitation."),
        "Solution": _l("Please try again later.")
    },
    'Builder.OntoBlue.OtlTask.OntologyIdNotExist': {
        "ErrorCode": 'Builder.OntoBlue.OtlTask.OntologyIdNotExist',
        "Description": _l("ontology_id [ontology_id] not exists."),
        "ErrorDetails": _l("ontology_id [ontology_id] not exists."),
        "Solution": _l('Please check your parameter again.')
    },
    'Builder.OntoBlue.OtlTask.DsIdNotExist': {
        "ErrorCode": 'Builder.OntoBlue.OtlTask.DsIdNotExist',
        "Description": _l("ds_id [ds_id] not exists."),
        "ErrorDetails": _l("ds_id [ds_id] not exists."),
        "Solution": _l('Please check your parameter again.')
    },
    'Builder.OtlController.GetTable.ParamError': {
        "ErrorCode": "Builder.OtlController.GetTable.ParamError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlController.GetTaskInfo.ParamError': {
        "ErrorCode": "Builder.OtlController.GetTaskInfo.ParamError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlController.GetTaskInfo.UnknownError': {
        "ErrorCode": "Builder.OtlController.GetTaskInfo.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.OntologyController.SaveOntology.ParamsError': {
        "ErrorCode": "Builder.OntologyController.SaveOntology.ParamsError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.SaveOntology.UnknownError': {
        "ErrorCode": "Builder.OntologyController.SaveOntology.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.OtlService.OntologySave.OtlNameDuplicate': {
        "ErrorCode": "Builder.OtlService.OntologySave.OtlNameDuplicate",
        "Description": _l("Duplicate ontology name."),
        "ErrorDetails": _l("Name already exists, please modify"),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.OntologySave.KnwIdNotExist': {
        "ErrorCode": "Builder.OtlService.OntologySave.KnwIdNotExist",
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.OntologyController.EditOntology.ParamError': {
        "ErrorCode": "Builder.OntologyController.SaveOntology.ParamsError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.EditOntology.UnknownError': {
        "ErrorCode": "Builder.OntologyController.EditOntology.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.OtlService.EditOntology.OtlIdNotExist': {
        "ErrorCode": "Builder.OtlService.EditOntology.OtlIdNotExist",
        "Description": _l('ontology_id [ontology_id] not exists.'),
        "ErrorDetails": _l('ontology_id [ontology_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.OntologyEdit.OtlNameDuplicate': {
        "ErrorCode": "Builder.OtlService.OntologyEdit.OtlNameDuplicate",
        "Description": _l("Duplicate ontology name."),
        "ErrorDetails": _l("Name already exists, please modify"),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.OntologyController.DelOntology.ParamError': {
        "ErrorCode": "Builder.OntologyController.DelOntology.ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.DelOntology.UnknownError': {
        "ErrorCode": "Builder.OntologyController.DelOntology.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.OtlService.DeleteOntology.KnwIdNotExist': {
        "ErrorCode": "Builder.OtlService.DeleteOntology.KnwIdNotExist",
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.OtlService.DeleteOntology.OtlNotExistInKnw': {
        "ErrorCode": "Builder.OtlService.DeleteOntology.OtlNotExistInKnw",
        "Description": _l('ontology [otl_id] does not exist in knowledge network [knw_id]. '),
        "ErrorDetails": _l('ontology [otl_id] does not exist in knowledge network [knw_id]. '),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.OntologyController.GetAll.ParamError': {
        "ErrorCode": "Builder.OntologyController.GetAll.ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.GetAll.UnknownError': {
        "ErrorCode": "Builder.OntologyController.GetAll.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OtlService.GetAll.KnwIdNotExist': {
        "ErrorCode": "Builder.OtlService.GetAll.KnwIdNotExist",
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.Otl.ParamError': {
        "ErrorCode": "Builder.OntologyController.Otl.ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.Otl.UnknownError': {
        "ErrorCode": "Builder.OntologyController.Otl.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OtlService.GetById.OtlIdNotExist': {
        "ErrorCode": "Builder.OtlService.GetById.OtlIdNotExist",
        "Description": _l('ontology_id [ontology_id] not exists.'),
        "ErrorDetails": _l('ontology_id [ontology_id] not exists.'),
        "Solution": _l("Please contact the developers.")
    },


    'Builder.OntologyController.ImportTask.ParamError': {
        "ErrorCode": 'Builder.OntologyController.ImportTask.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.ImportTask.UnknownError': {
        "ErrorCode": 'Builder.OntologyController.ImportTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OntologyController.ImportTask.KnwIdNotExist': {
        "ErrorCode": 'Builder.OntologyController.ImportTask.KnwIdNotExist',
        "Description": _l("knw_id [knw_id] not exists"),
        "ErrorDetails": _l("knw_id [knw_id] not exists"),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.ImportTask.AsyncTaskInternalError': {
        "ErrorCode": 'Builder.OntologyController.ImportTask.AsyncTaskInternalError',
        "Description": _l("send async task failed."),
        "ErrorDetails": "[detail]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OntologyController.GetImportTask.ParamError': {
        "ErrorCode": 'Builder.OntologyController.GetImportTask.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.GetImportTask.UnknownError': {
        "ErrorCode": 'Builder.OntologyController.GetImportTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OtlService.GetImportTask.CeleryTaskIdNotExists': {
        "ErrorCode": 'Builder.OtlService.GetImportTask.CeleryTaskIdNotExists',
        "Description": _l("celery_task_id [celery_task_id] not exists"),
        "ErrorDetails": _l("celery_task_id [celery_task_id] not exists"),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OntologyController.DownloadOntoTemplate.ParamError': {
        "ErrorCode": 'Builder.OntologyController.DownloadOntoTemplate.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.DownloadOntoTemplate.UnknownError': {
        "ErrorCode": 'Builder.OntologyController.DownloadOntoTemplate.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OntologyController.ExportOnto.ParamError': {
        "ErrorCode": 'Builder.OntologyController.ExportOnto.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.ExportOnto.UnknownError': {
        "ErrorCode": 'Builder.OntologyController.ExportOnto.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OtlService.ExportOnto.OtlIdNotExist': {
        "ErrorCode": 'Builder.OtlService.ExportOnto.OtlIdNotExist',
        "Description": _l('otl_id [otl_id] not exists. '),
        "ErrorDetails": _l('otl_id [otl_id] not exists. '),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.ExportOnto.OtlIdNotInOtlLibrary': {
        "ErrorCode": 'Builder.OtlService.ExportOnto.OtlIdNotInOtlLibrary',
        "Description": _l('otl_id [otl_id] not in ontology library. '),
        "ErrorDetails": _l('otl_id [otl_id] not in ontology library. '),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.OntologyController.UpdateName.ParamError': {
        "ErrorCode": 'Builder.OntologyController.UpdateName.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.UpdateName.UnknownError': {
        "ErrorCode": 'Builder.OntologyController.UpdateName.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.OtlService.UpdateName.OtlIdNotExist': {
        "ErrorCode": "Builder.OtlService.UpdateName.OtlIdNotExist",
        "Description": _l('ontology_id [ontology_id] not exists.'),
        "ErrorDetails": _l('ontology_id [ontology_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.UpdateName.OtlNameDuplicate': {
        "ErrorCode": "Builder.OtlService.UpdateName.OtlNameDuplicate",
        "Description": _l("Duplicate ontology name."),
        "ErrorDetails": _l("Name already exists, please modify"),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.OntologyController.SqlExtract.ParamError': {
        "ErrorCode": "Builder.OntologyController.SqlExtract.ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.SqlExtract.UnknownError': {
        "ErrorCode": "Builder.OntologyController.SqlExtract.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.OtlService.SqlExtract.DsIdNotExist': {
        "ErrorCode": "Builder.OtlService.SqlExtract.DsIdNotExist",
        "Description": _l("ds_id [ds_id] not exists."),
        "ErrorDetails": _l("ds_id [ds_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.SqlExtract.DataSourceError': {
        "ErrorCode": "Builder.OtlService.SqlExtract.DataSourceError",
        "Description": _l("Data source type [data_source] does not support SQL extracting. "),
        "ErrorDetails": _l("Data source type [data_source] does not support SQL extracting. "),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.SqlExtract.SqlError': {
        "ErrorCode": "Builder.OtlService.SqlExtract.SqlError",
        "Description": _l("SQL statement execution error, please check your SQL statement. "),
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.SqlExtract.TimeOutError': {
        "ErrorCode": "Builder.OtlService.SqlExtract.TimeOutError",
        "Description": _l("SQL statement execution timeout, please optimise your SQL statement. "),
        "ErrorDetails": _l("SQL statement execution timeout, please optimise your SQL statement. "),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OtlService.SqlExtract.PasswordError': {
        "ErrorCode": "Builder.OtlService.SqlExtract.PasswordError",
        "Description": "[cause]",
        "ErrorDetails": "[cause]",
        "Solution": _l('please check your data source again.')
    },
    'Builder.OtlService.SqlExtract.FieldRepeats': {
        "ErrorCode": "Builder.OtlService.SqlExtract.FieldRepeats",
        "Description": _l("Duplicate field names exist in SQL extracting results. "),
        "ErrorDetails": _l("Duplicate field names exist in SQL extracting results. "),
        "Solution": _l('please check your data source again.')
    },
    'Builder.OtlService.SqlExtract.EmptyData': {
        "ErrorCode": "Builder.OtlService.SqlExtract.EmptyData",
        "Description": _l("Data extracting is empty, please re-select the data table used in SQL statement or go database to add data"),
        "ErrorDetails": _l("Data extracting is empty, please re-select the data table used in SQL statement or go database to add data"),
        "Solution": _l('please check your data source again.')
    },

    'Builder.OntologyController.SqlPreViewData.ParamError': {
        "ErrorCode": "Builder.OntologyController.SqlPreViewData.ParamError",
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.OntologyController.SqlPreviewData.UnknownError': {
        "ErrorCode": "Builder.OntologyController.SqlPreviewData.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
}
