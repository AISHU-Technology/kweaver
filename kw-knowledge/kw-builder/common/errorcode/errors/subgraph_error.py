# -*- coding:utf-8 -*-
from flask_babel import gettext as _l

errDict = {
    'Builder.SubgraphService.CreateSubgraphConfig.GraphIdNotExist': {
        "ErrorCode": "Builder.SubgraphService.CreateSubgraphConfig.GraphIdNotExist",
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.CreateSubgraphConfig.OntologyNotExist': {
        "ErrorCode": 'Builder.SubgraphService.CreateSubgraphConfig.OntologyNotExist',
        "Description": _l("ontology_id [ontology_id] not exists."),
        "ErrorDetails": _l("ontology_id [ontology_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.CreateSubgraphConfig.DuplicateName': {
        "ErrorCode": 'Builder.SubgraphService.CreateSubgraphConfig.DuplicateName',
        "Description": _l("subgraph name [name] already exists."),
        "ErrorDetails": _l("subgraph name [name] already exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.CreateSubgraphConfig.UnexpectedClass': {
        "ErrorCode": 'Builder.SubgraphService.CreateSubgraphConfig.UnexpectedClass',
        "Description": _l("there are entity classes or edge classes not in the ontology. "),
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.CreateSubgraphConfig.GraphRunning': {
        "ErrorCode": 'Builder.SubgraphService.CreateSubgraphConfig.GraphRunning',
        "Description": _l("graph is running or waiting."),
        "ErrorDetails": _l("graph is running or waiting"),
        "Solution": _l("Please stop building graph or wait the graph finish building.")
    },

    'Builder.SubgraphService.EditSubgraphConfig.GraphIdNotExist': {
        "ErrorCode": 'Builder.SubgraphService.EditSubgraphConfig.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.EditSubgraphConfig.SubgraphIdNotExist': {
        "ErrorCode": 'Builder.SubgraphService.EditSubgraphConfig.SubgraphIdNotExist',
        "Description": _l("subgraph_id [subgraph_id] not exists."),
        "ErrorDetails": _l("subgraph_id [subgraph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.EditSubgraphConfig.DuplicateName': {
        "ErrorCode": 'Builder.SubgraphService.EditSubgraphConfig.DuplicateName',
        "Description": _l("subgraph name already exists."),
        "ErrorDetails": _l("names of these subgraphs are duplicate: [items]"),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.EditSubgraphConfig.UnexpectedClass': {
        "ErrorCode": 'Builder.SubgraphService.EditSubgraphConfig.UnexpectedClass',
        "Description": _l("there are entity classes or edge classes not in the ontology. "),
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.EditSubgraphConfig.GraphRunning': {
        "ErrorCode": 'Builder.SubgraphService.EditSubgraphConfig.GraphRunning',
        "Description": _l("graph is running or waiting."),
        "ErrorDetails": _l("graph is running or waiting"),
        "Solution": _l("Please stop building graph or wait the graph finish building.")
    },
    'Builder.SubgraphService.EditSubgraphConfig.UngroupedCannotRename': {
        "ErrorCode": 'Builder.SubgraphService.EditSubgraphConfig.UngroupedCannotRename',
        "Description": _l("ungrouped subgraph [subgraph_id] cannot rename."),
        "ErrorDetails": _l("ungrouped subgraph [subgraph_id] cannot rename."),
        "Solution": _l("you cannot rename ungrouped.")
    },
    'Builder.SubgraphService.EditSubgraphConfig.CannotRenamedToUngrouped': {
        "ErrorCode": 'Builder.SubgraphService.EditSubgraphConfig.CannotRenamedToUngrouped',
        "Description": _l("subgraph [subgraph_id] name cannot be 未分组 or ungrouped. "),
        "ErrorDetails": _l("subgraph [subgraph_id] name cannot be 未分组 or ungrouped. "),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder_SubgraphService_SubgraphSaveNoCheck_GraphIdNotExist': {
        "ErrorCode": 'Builder_SubgraphService_SubgraphSaveNoCheck_GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder_SubgraphService_SubgraphSaveNoCheck_GraphRunning': {
        "ErrorCode": 'Builder_SubgraphService_SubgraphSaveNoCheck_GraphRunning',
        "Description": _l("graph is running or waiting."),
        "ErrorDetails": _l("graph is running or waiting"),
        "Solution": _l("Please stop building graph or wait the graph finish building.")
    },
    'Builder_SubgraphService_SubgraphSaveNoCheck_CannotRenamedToUngrouped': {
        "ErrorCode": 'Builder_SubgraphService_SubgraphSaveNoCheck_CannotRenamedToUngrouped',
        "Description": _l("subgraph [subgraph_id] name cannot be 未分组 or ungrouped. "),
        "ErrorDetails": _l("subgraph [subgraph_id] name cannot be 未分组 or ungrouped. "),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder_SubgraphService_SubgraphSaveNoCheck_SubgraphIdNotExist': {
        "ErrorCode": 'Builder_SubgraphService_SubgraphSaveNoCheck_SubgraphIdNotExist',
        "Description": _l("subgraph_id [subgraph_id] not exists."),
        "ErrorDetails": _l("subgraph_id [subgraph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder_SubgraphService_SubgraphSaveNoCheck_UngroupedCannotRename': {
        "ErrorCode": 'Builder_SubgraphService_SubgraphSaveNoCheck_UngroupedCannotRename',
        "Description": _l("ungrouped subgraph [subgraph_id] cannot rename."),
        "ErrorDetails": _l("ungrouped subgraph [subgraph_id] cannot rename."),
        "Solution": _l("you cannot rename ungrouped.")
    },

    'Builder.SubgraphService.GetSubgraphList.GraphIdNotExist': {
        "ErrorCode": 'Builder.SubgraphService.GetSubgraphList.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.GetSubgraphConfig.SubgraphIdNotExist': {
        "ErrorCode": 'Builder.SubgraphService.GetSubgraphConfig.SubgraphIdNotExist',
        "Description": _l("subgraph_id [subgraph_id] not exists."),
        "ErrorDetails": _l("subgraph_id [subgraph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.SubgraphService.DeleteSubgraphConfig.GraphIdNotExist': {
        "ErrorCode": 'Builder.SubgraphService.DeleteSubgraphConfig.GraphIdNotExist',
        "Description": _l("graph_id [graph_id] not exists."),
        "ErrorDetails": _l("graph_id [graph_id] not exists."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.SubgraphService.DeleteSubgraphConfig.GraphRunning': {
        "ErrorCode": 'Builder.SubgraphService.DeleteSubgraphConfig.GraphRunning',
        "Description": _l("graph status is running, cannot delete subgraph."),
        "ErrorDetails": _l("graph status is running, cannot delete subgraph."),
        "Solution": _l("Please stop building graph or wait the graph finish building.")
    },
    'Builder.SubgraphService.DeleteSubgraphConfig.GraphWaiting': {
        "ErrorCode": 'Builder.SubgraphService.DeleteSubgraphConfig.GraphWaiting',
        "Description": _l("graph status is waiting, cannot delete subgraph."),
        "ErrorDetails": _l("graph status is waiting, cannot delete subgraph."),
        "Solution": _l("Please stop building graph or wait the graph finish building.")
    },
    'Builder.SubgraphService.DeleteSubgraphConfig.DeleteUngrouped': {
        "ErrorCode": 'Builder.SubgraphService.DeleteSubgraphConfig.DeleteUngrouped',
        "Description": _l("cannot delete ungrouped subgraph [subgraph_id]."),
        "ErrorDetails": _l("cannot delete ungrouped subgraph [subgraph_id]."),
        "Solution": _l("Please change the subgraph to delete.")
    },
    'Builder.SubgraphService.DeleteSubgraphConfig.SubgraphIdNotExist': {
        "ErrorCode": 'Builder.SubgraphService.DeleteSubgraphConfig.SubgraphIdNotExist',
        "Description": _l("subgraph_id [subgraph_id] does not exist or does not match the graph_id."),
        "ErrorDetails": _l("subgraph_id [subgraph_id] does not exist or does not match the graph_id."),
        "Solution": _l("Please change the subgraph to delete.")
    },

}
