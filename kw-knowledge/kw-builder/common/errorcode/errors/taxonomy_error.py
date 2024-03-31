# -*- coding:utf-8 -*-
from flask_babel import gettext as _l

errDict = {
    'Builder.TaxonomyController.CreateTaxonomy.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.CreateTaxonomy.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.CreateTaxonomy.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.CreateTaxonomy.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.CreateTaxonomy.KnwIdNotExist': {
        "ErrorCode": "Builder.TaxonomyController.CreateTaxonomy.KnwIdNotExist",
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.CreateTaxonomy.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.CreateTaxonomy.NoPermissionError",
        "Description": _l("user does not have access to the knowledge network"),
        "ErrorDetails": _l("user does not have access to the knowledge network"),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.CreateTaxonomy.DuplicateName': {
        "ErrorCode": "Builder.TaxonomyService.CreateTaxonomy.DuplicateName",
        "Description": _l("name [name] is duplicate."),
        "ErrorDetails": _l("name [name] is duplicate."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.CreateTaxonomy.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.CreateTaxonomy.NebulaError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether your GraphDB service is running normally.")
    },
    'Builder.TaxonomyService.CreateTaxonomy.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.CreateTaxonomy.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.EditTaxonomy.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.EditTaxonomy.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.EditTaxonomy.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.EditTaxonomy.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.EditTaxonomy.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.EditTaxonomy.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.EditTaxonomy.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.EditTaxonomy.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.EditTaxonomy.DuplicateName': {
        "ErrorCode": "Builder.TaxonomyService.EditTaxonomy.DuplicateName",
        "Description": _l("name [name] is duplicate."),
        "ErrorDetails": _l("name [name] is duplicate."),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.TaxonomyController.GetTaxonomyList.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.GetTaxonomyList.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.GetTaxonomyList.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.GetTaxonomyList.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetTaxonomyList.KnwIdNotExist': {
        "ErrorCode": "Builder.TaxonomyController.GetTaxonomyList.KnwIdNotExist",
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.TaxonomyController.DeleteTaxonomy.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.DeleteTaxonomy.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.DeleteTaxonomy.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.DeleteTaxonomy.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.DeleteTaxonomy.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.DeleteTaxonomy.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.DeleteTaxonomy.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.DeleteTaxonomy.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again."),
    },

    'Builder.TaxonomyController.AddWord.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.AddWord.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.AddWord.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.AddWord.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.AddWord.DBNotExistError': {
        "ErrorCode": "Builder.TaxonomyService.AddWord.DBNotExistError",
        "Description": _l("Nebula space has not been created yet."),
        "ErrorDetails": _l("Nebula space has not been created yet."),
        "Solution": _l("Please wait for 20 seconds and try again.")
    },
    'Builder.TaxonomyService.AddWord.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.AddWord.NebulaError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether your GraphDB service is running normally.")
    },
    'Builder.TaxonomyService.AddWord.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.AddWord.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    "Builder.TaxonomyService.AddWord.DuplicateName": {
        "ErrorCode": 'Builder.TaxonomyService.AddWord.DuplicateName',
        "Description": _l("name [name] is duplicate."),
        "ErrorDetails": _l("name [name] is duplicate."),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.AddWord.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.AddWord.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.AddWord.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.AddWord.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.AddWord.ParentNotExist': {
        "ErrorCode": 'Builder.TaxonomyService.AddWord.ParentNotExist',
        "Description": _l("word id [word_id] not exists"),
        "ErrorDetails": _l("word id [word_id] not exists"),
        "Solution": _l("Please check your parameter again."),
    },

    'Builder.TaxonomyController.EditWordLabel.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.EditWordLabel.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.EditWordLabel.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.EditWordLabel.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.EditWordLabel.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.EditWordLabel.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.EditWordLabel.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.EditWordLabel.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.EditWordLabel.WordIdNotExist': {
        "ErrorCode": 'Builder.TaxonomyService.EditWordLabel.WordIdNotExist',
        "Description": _l("word id [word_id] not exists"),
        "ErrorDetails": _l("word id [word_id] not exists"),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.EditWordLabel.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.EditWordLabel.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    "Builder.TaxonomyService.EditWordLabel.DuplicateName": {
        "ErrorCode": 'Builder.TaxonomyService.EditWordLabel.DuplicateName',
        "Description": _l("[language] name [name] is duplicate."),
        "ErrorDetails": _l("[language] name [name] is duplicate."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.TaxonomyService.EditWordLabel.LanguageExists": {
        "ErrorCode": 'Builder.TaxonomyService.EditWordLabel.LanguageExists',
        "Description": _l("[language] information already exists."),
        "ErrorDetails": _l("[language] information already exists."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.TaxonomyService.EditWordLabel.LanguageNotExists": {
        "ErrorCode": 'Builder.TaxonomyService.EditWordLabel.LanguageNotExists',
        "Description": _l("[language] information does not exist."),
        "ErrorDetails": _l("[language] information does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.TaxonomyService.EditWordLabel.LastLanguage": {
        "ErrorCode": 'Builder.TaxonomyService.EditWordLabel.LanguageNotExists',
        "Description": _l("The basic information of the last language cannot be deleted"),
        "ErrorDetails": _l("The basic information of the last language cannot be deleted"),
        "Solution": _l("Please check your parameter again.")
    },

    'Builder.TaxonomyController.EditWordLevel.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.EditWordLevel.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.EditWordLevel.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.EditWordLevel.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.EditWordLevel.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.EditWordLevel.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.EditWordLevel.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.EditWordLevel.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.EditWordLevel.WordIdNotExist': {
        "ErrorCode": 'Builder.TaxonomyService.EditWordLevel.WordIdNotExist',
        "Description": _l("word id [word_id] not exists"),
        "ErrorDetails": _l("word id [word_id] not exists"),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.EditWordLevel.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.EditWordLevel.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.EditWordLevel.LoopExists': {
        "ErrorCode": 'Builder.TaxonomyService.EditWordLevel.LoopExists',
        "Description": _l('word cannot be moved to child level'),
        "ErrorDetails": _l('word cannot be moved to child level'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.EditWordLevel.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.EditWordLevel.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.GetTopWords.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.GetTopWords.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.GetTopWords.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.GetTopWords.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetTopWords.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.GetTopWords.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.GetTopWords.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.GetTopWords.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.GetTopWords.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.GetTopWords.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.GetChildWords.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.GetChildWords.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.GetChildWords.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.GetChildWords.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetChildWords.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.GetChildWords.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.GetChildWords.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.GetChildWords.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.GetChildWords.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.GetChildWords.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetChildWords.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.GetChildWords.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetChildWords.WordIdNotExist': {
        "ErrorCode": 'Builder.TaxonomyService.GetChildWords.WordIdNotExist',
        "Description": _l("word id [word_id] not exists"),
        "ErrorDetails": _l("word id [word_id] not exists"),
        "Solution": _l("Please check your parameter again."),
    },

    'Builder.TaxonomyController.GetWords.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.GetWords.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.GetWords.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.GetWords.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetWords.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.GetWords.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.GetWords.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.GetWords.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.GetWords.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.GetWords.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.SearchWord.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.SearchWord.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.SearchWord.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.SearchWord.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.SearchWord.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.SearchWord.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.SearchWord.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.SearchWord.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.SearchWord.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.SearchWord.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.LocateWord.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.LocateWord.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.LocateWord.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.LocateWord.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.LocateWord.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.LocateWord.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.LocateWord.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.LocateWord.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.LocateWord.WordIdNotExist': {
        "ErrorCode": 'Builder.TaxonomyService.LocateWord.WordIdNotExist',
        "Description": _l("word id [word_id] not exists"),
        "ErrorDetails": _l("word id [word_id] not exists"),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.LocateWord.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.LocateWord.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.LocateWord.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.LocateWord.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.DeleteWord.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.DeleteWord.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.DeleteWord.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.DeleteWord.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.DeleteWord.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.DeleteWord.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.DeleteWord.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.DeleteWord.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.DeleteWord.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.DeleteWord.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.DeleteWord.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.DeleteWord.NebulaError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please check whether your GraphDB service is running normally.")
    },

    'Builder.TaxonomyController.EditCustomRelation.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.EditCustomRelation.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.EditCustomRelation.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.EditCustomRelation.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.EditCustomRelation.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.EditCustomRelation.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.EditCustomRelation.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.EditCustomRelation.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.EditCustomRelation.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.EditCustomRelation.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.GetCustomRelation.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.GetCustomRelation.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.GetCustomRelation.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.GetCustomRelation.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetCustomRelation.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.GetCustomRelation.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.GetCustomRelation.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.GetCustomRelation.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },

    'Builder.TaxonomyController.CreateRelationIspartof.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.CreateRelationIspartof.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.CreateRelationIspartof.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.CreateRelationIspartof.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.CreateRelationIspartof.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.CreateRelationIspartof.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.CreateRelationIspartof.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.CreateRelationIspartof.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.CreateRelationIspartof.WordIdNotExist': {
        "ErrorCode": 'Builder.TaxonomyService.CreateRelationIspartof.WordIdNotExist',
        "Description": _l("word id [word_id] not exists"),
        "ErrorDetails": _l("word id [word_id] not exists"),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.CreateRelationIspartof.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.CreateRelationIspartof.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.CreateRelationIspartof.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.CreateRelationIspartof.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.DeleteRelationIspartof.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.DeleteRelationIspartof.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.DeleteRelationIspartof.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.DeleteRelationIspartof.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.DeleteRelationIspartof.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.DeleteRelationIspartof.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.DeleteRelationIspartof.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.DeleteRelationIspartof.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.DeleteRelationIspartof.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.DeleteRelationIspartof.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.EditRelationCustom.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.EditRelationCustom.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.EditRelationCustom.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.EditRelationCustom.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.EditRelationCustom.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.EditRelationCustom.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.EditRelationCustom.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.EditRelationCustom.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.EditRelationCustom.CustomRelationIdNotExists': {
        "ErrorCode": "Builder.TaxonomyService.EditRelationCustom.CustomRelationIdNotExists",
        "Description": _l('Custom relationship does not exist, please modify'),
        "ErrorDetails": _l('Custom relationship does not exist, please modify'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.EditRelationCustom.WordIdNotExist': {
        "ErrorCode": 'Builder.TaxonomyService.EditRelationCustom.WordIdNotExist',
        "Description": _l("word id [word_id] not exists"),
        "ErrorDetails": _l("word id [word_id] not exists"),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.EditRelationCustom.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.EditRelationCustom.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.EditRelationCustom.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.EditRelationCustom.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.DeleteRelationCustom.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.DeleteRelationCustom.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.DeleteRelationCustom.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.DeleteRelationCustom.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.DeleteRelationCustom.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.DeleteRelationCustom.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.DeleteRelationCustom.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.DeleteRelationCustom.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.DeleteRelationCustom.CustomRelationIdNotExists': {
        "ErrorCode": "Builder.TaxonomyService.DeleteRelationCustom.CustomRelationIdNotExists",
        "Description": _l('Custom relationship does not exist, please modify'),
        "ErrorDetails": '[relation_id]',
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.DeleteRelationCustom.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.DeleteRelationCustom.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.DeleteRelationCustom.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.DeleteRelationCustom.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.GetRelationIspartof.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.GetRelationIspartof.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.GetRelationIspartof.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.GetRelationIspartof.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetRelationIspartof.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.GetRelationIspartof.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.GetRelationIspartof.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.GetRelationIspartof.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.GetRelationIspartof.WordIdNotExist': {
        "ErrorCode": 'Builder.TaxonomyService.GetRelationIspartof.WordIdNotExist',
        "Description": _l("word id [word_id] not exists"),
        "ErrorDetails": _l("word id [word_id] not exists"),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.GetRelationIspartof.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.GetRelationIspartof.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetRelationIspartof.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.GetRelationIspartof.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.GetRelationCustom.ParamError': {
        "ErrorCode": 'Builder.TaxonomyController.GetRelationCustom.ParamError',
        "Description": "[message]",
        "ErrorDetails": "[message]",
        "Solution": _l("Please check your parameter again.")  # "请重新检查输入参数"
    },
    'Builder.TaxonomyController.GetRelationCustom.UnknownError': {
        "ErrorCode": "Builder.TaxonomyController.GetRelationCustom.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[cause]",
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetRelationCustom.TaxonomyIdNotExist': {
        "ErrorCode": "Builder.TaxonomyService.GetRelationCustom.TaxonomyIdNotExist",
        "Description": _l('taxonomy id [taxonomy_id] not exists.'),
        "ErrorDetails": _l('taxonomy id [taxonomy_id] not exists.'),
        "Solution": _l("Please check your parameter again.")
    },
    'Builder.TaxonomyService.GetRelationCustom.NoPermissionError': {
        "ErrorCode": "Builder.TaxonomyService.GetRelationCustom.NoPermissionError",
        "Description": _l("No permissions for taxonomy [id]."),
        "ErrorDetails": _l("No permissions for taxonomy [id]."),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.GetRelationCustom.WordIdNotExist': {
        "ErrorCode": 'Builder.TaxonomyService.GetRelationCustom.WordIdNotExist',
        "Description": _l("word id [word_id] not exists"),
        "ErrorDetails": _l("word id [word_id] not exists"),
        "Solution": _l("Please check your parameter again."),
    },
    'Builder.TaxonomyService.GetRelationCustom.OpensearchError': {
        "ErrorCode": "Builder.TaxonomyService.GetRelationCustom.OpensearchError",
        "Description": '[message]',
        "ErrorDetails": _l('Opensearch has some error.'),
        "Solution": _l("Please contact the developers.")
    },
    'Builder.TaxonomyService.GetRelationCustom.NebulaError': {
        "ErrorCode": "Builder.TaxonomyService.GetRelationCustom.NebulaError",
        "Description": '[description]',
        "ErrorDetails": '[cause]',
        "Solution": _l("Please contact the developers.")
    },

    'Builder.TaxonomyController.KnowledgeCapacityError': {
        "ErrorCode": "Builder.TaxonomyController.KnowledgeCapacityError",
        "Description": "Insufficient available graph capacity;",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please improve your knowledge capacity.")
    },
}
