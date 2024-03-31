# -*- coding:utf-8 -*-
from flask_babel import gettext as _l

errDict = {
    # 'Builder.CeleryController.GetSubgraphConfig.ParamError': {
    #     "ErrorCode": 'Builder.CeleryController.GetSubgraphConfig.ParamError',
    #     "Description": '[message]',
    #     "ErrorDetails": '[message]',
    #     "Solution": _l("Please check your parameter again.")
    # },
    # 'Builder.CeleryController.GetSubgraphConfig.UnknownError': {
    #     "ErrorCode": 'Builder.CeleryController.GetSubgraphConfig.UnknownError',
    #     "Description": "[description]",
    #     "ErrorDetails": "[cause]",
    #     "Solution": _l("Please contact the developers.")
    # },
    # 'Builder.TaskService.GetSubgraphConfig.TaskIdNotExist': {
    #     "ErrorCode": 'Builder.TaskService.GetSubgraphConfig.TaskIdNotExist',
    #     "Description": _l("task_id [task_id] not exists."),
    #     "ErrorDetails": _l("task_id [task_id] not exists."),
    #     "Solution": _l("Please check your parameter again.")
    # },
    'Builder.CeleryController.BatchExecuteTask.ParamError': {
        "ErrorCode": 'Builder.CeleryController.BatchExecuteTask.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryController.BatchExecuteTask.UnknownError': {
        "ErrorCode": 'Builder.CeleryController.BatchExecuteTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.CeleryController.BatchExecuteTask.GraphIdNotExist': {
        "ErrorCode": 'Builder.CeleryController.BatchExecuteTask.GraphIdNotExist',
        "Description": _l("graph id [graph_id] not exists."),
        "ErrorDetails": _l("graph id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryBlue.TaskBatch.UnknownError': {
        "ErrorCode": 'Builder.CeleryBlue.TaskBatch.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.CeleryBlue.TaskBatch.SubgraphIdNotExist': {
        "ErrorCode": 'Builder.CeleryBlue.TaskBatch.SubgraphIdNotExist',
        "Description": _l("subgraph id [subgraph_id] not exists."),
        "ErrorDetails": _l("subgraph id [subgraph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryBlue.TaskBatch.GraphDBNotExist': {
        "ErrorCode": 'Builder.CeleryBlue.TaskBatch.GraphDBNotExist',
        "Description": _l("task cannot run, the storage address of this graph does not exist."),
        "ErrorDetails": _l("invalid storage address."),
        "Solution": _l("Please config a valid graph_db address for this graph.")
    },
    'Builder.CeleryBlue.TaskBatch.GraphInEditingStatus': {
        "ErrorCode": 'Builder.CeleryBlue.TaskBatch.GraphInEditingStatus',
        "Description": _l("task cannot run, the current knowledge graph has not been configured yet."),
        "ErrorDetails": _l("task cannot run, the current knowledge graph has not been configured yet."),
        "Solution": _l("Please try again after configuration.")
    },
    'Builder.CeleryBlue.TaskBatch.GraphInRunningOrWaiting': {
        "ErrorCode": 'Builder.CeleryBlue.TaskBatch.GraphInRunningOrWaiting',
        "Description": _l("task cannot run, the current knowledge graph is running or waiting."),
        "ErrorDetails": _l("task cannot run, the current knowledge graph is running or waiting."),
        "Solution": _l("Please try again after the task ends.")
    },
    'Builder.CeleryBlue.TaskBatch.GraphBeingUploaded': {
        "ErrorCode": 'Builder.CeleryBlue.TaskBatch.GraphBeingUploaded',
        "Description": _l("task cannot run, the graph is being uploaded. "),
        "ErrorDetails": _l("task cannot run, the graph is being uploaded. "),
        "Solution": _l("Please try again after the uploading task ends.")
    },
    # 'Builder.CeleryController.GetProgress.ParamError': {
    #     "ErrorCode": 'Builder.CeleryController.GetProgress.ParamError',
    #     "Description": _l("task id must be integer."),
    #     "ErrorDetails": _l("task id must be integer."),
    #     "Solution": _l("Please check your parameter again.")
    # },
    # 'Builder.CeleryBlue.GetProgressByTaskId.TaskIdNotExist': {
    #     "ErrorCode": 'Builder.CeleryBlue.GetProgressByTaskId.TaskIdNotExist',
    #     "Description": _l("task id [task_id] not exists."),
    #     "ErrorDetails": _l("task id [task_id] not exists."),
    #     "Solution": _l("Please check your parameter again.")
    # },
    # 'Builder.CeleryController.GetProgress.UnknownError': {
    #     "ErrorCode": 'Builder.CeleryController.GetProgress.UnknownError',
    #     "Description": "[description]",
    #     "ErrorDetails": "[cause]",
    #     "Solution": _l("Please contact the developers.")
    # },
    # 'Builder.CeleryBlue.GetProgressByTaskId.UnknownError': {
    #     "ErrorCode": 'Builder.CeleryBlue.GetProgressByTaskId.UnknownError',
    #     "Description": "[description]",
    #     "ErrorDetails": "[cause]",
    #     "Solution": _l("Please contact the developers.")
    # },
    'Builder.CeleryController.StopTask.ParamError': {
        "ErrorCode": 'Builder.CeleryController.StopTask.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryController.StopTask.UnknownError': {
        "ErrorCode": 'Builder.CeleryController.StopTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.CeleryBlue.StopTask.UnknownError': {
        "ErrorCode": 'Builder.CeleryBlue.StopTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.CeleryBlue.StopTask.TaskNotExist': {
        "ErrorCode": 'Builder.CeleryBlue.StopTask.TaskNotExist',
        "Description": _l("task not exists. "),
        "ErrorDetails": _l("task not exists. "),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryBlue.StopTask.TerminationNotAllowed': {
        "ErrorCode": 'Builder.CeleryBlue.StopTask.TerminationNotAllowed',
        "Description": _l("task cannot stop, because the task status is not waiting or running."),
        "ErrorDetails": _l("task cannot stop, because the task status is not waiting or running."),
        "Solution": _l("you cannot stop a completed graph task.")
    },
    'Builder.CeleryController.GetAllTask.UnknownError': {
        "ErrorCode": 'Builder.CeleryController.GetAllTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.CeleryController.GetAllTask.ParamError': {
        "ErrorCode": 'Builder.CeleryController.GetAllTask.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryController.GetAllTask.GraphIdNotExist': {
        "ErrorCode": 'Builder.CeleryController.GetAllTask.GraphIdNotExist',
        "Description": _l("graph id [graph_id] not exists."),
        "ErrorDetails": _l("graph id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryBlue.GetAllTask.UnknownError': {
        "ErrorCode": 'Builder.CeleryBlue.GetAllTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.CeleryController.DeleteTask.UnknownError': {
        "ErrorCode": 'Builder.CeleryController.DeleteTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.CeleryController.DeleteTask.ParamError': {
        "ErrorCode": 'Builder.CeleryController.DeleteTask.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryController.DeleteTask.GraphIdNotExist': {
        "ErrorCode": 'Builder.CeleryController.DeleteTask.GraphIdNotExist',
        "Description": _l("graph id [graph_id] not exists."),
        "ErrorDetails": _l("graph id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryBlue.DeleteTask.UnknownError': {
        "ErrorCode": 'Builder.CeleryBlue.DeleteTask.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },

    'Builder.CeleryController.GetTaskDetail.ParamError': {
        "ErrorCode": 'Builder.CeleryController.GetTaskDetail.ParamError',
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryController.GetTaskDetail.UnknownError': {
        "ErrorCode": 'Builder.CeleryController.GetTaskDetail.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaskService.GetTaskDetail.TaskNotExist': {
        "ErrorCode": 'Builder.TaskService.GetTaskDetail.TaskNotExist',
        "Description": _l("task not exists. "),
        "ErrorDetails": _l("task not exists. "),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.CeleryBlue.GetTaskDetail.UnknownError': {
        "ErrorCode": 'Builder.CeleryBlue.GetTaskDetail.UnknownError',
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
}
