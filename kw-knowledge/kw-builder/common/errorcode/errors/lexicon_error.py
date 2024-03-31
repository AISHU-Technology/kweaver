# -*- coding: utf-8 -*-
'''
@Author ：Jay.zhu
@Date ：2022/8/13 11:03
'''
from flask_babel import gettext as _l

errDict = {
    "Builder.LexiconController.DatabaseError": {
        "ErrorCode": "Builder.LexiconController.DatabaseError",
        "Description": "Database error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check the database connection.")
    },
    "Builder.LexiconController.KnowledgeCapacityError": {
        "ErrorCode": "Builder.LexiconController.KnowledgeCapacityError",
        "Description": "Insufficient available graph capacity;",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please improve your knowledge capacity.")
    },
    "Builder.LexiconController.CreateLexicon.ParamError": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.CreateLexicon.KnowledgeIdNotExist": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.KnowledgeIdNotExist",
        "Description": "Invalid knowledge_id",
        "ErrorDetails": _l("The specified knowledge_id [knowledge_id] does not exist, lexicon creation failed!"),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.CreateLexicon.DuplicatedName": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.DuplicatedName",
        "Description": "Duplicate lexicon name",
        "ErrorDetails": _l("Lexicon name [lexicon_name] already exists and cannot be created repeatedly."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.CreateLexicon.FileUploadError": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.FileUploadError",
        "Description": "File upload failed",
        "ErrorDetails": _l("[ErrorDetails]"),
        "Solution": _l("Please check the type, size and content format of the uploaded file.")
    },
    "Builder.LexiconController.CreateLexicon.FilesNumberExceeded": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.FilesNumberExceeded",
        "Description": "File upload failed",
        "ErrorDetails": _l("Only one file can be selected at most."),
        "Solution": _l("Please select upload file again.")
    },
    "Builder.LexiconController.CreateLexicon.FileFormatError": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.FileFormatError",
        "Description": "File upload failed, file format error",
        "ErrorDetails": _l("The file format only supports txt and CSV."),
        "Solution": _l("Please select upload file again.")
    },
    "Builder.LexiconController.CreateLexicon.ContentFormatError": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.ContentFormatError",
        "Description": "File upload failed, file content format error",
        "ErrorDetails": _l("File content format error."),
        "Solution": _l("Please check the content and format of the document according to the template.")
    },
    "Builder.LexiconController.CreateLexicon.EncodingError": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.EncodingError",
        "Description": "File upload failed, file encoding error",
        "ErrorDetails": _l("The file only supports UTF-8 encoding."),
        "Solution": _l("Please confirm the file code and reselect the file.")
    },
    "Builder.LexiconController.CreateLexicon.DataExceeded": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.DataExceeded",
        "Description": "File upload failed, data amount exceeds",
        "ErrorDetails": _l("The amount of uploaded file data exceeds."),
        "Solution": _l("The uploaded file must be less than 10M and the number of lines must be less than 350000.")
    },
    "Builder.LexiconController.CreateLexicon.AsyncTaskInternalError": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.AsyncTaskInternalError",
        "Description": _l("async task service internal error"),
        "ErrorDetails": _l("[detail]"),
        "Solution": _l("Please contact the developers.")
    },
    "Builder.LexiconController.CreateTemplateLexicon.ParamError": {
        "ErrorCode": "Builder.LexiconController.CreateTemplateLexicon.ParamError",
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.CreateTemplateLexicon.UnknownError": {
        "ErrorCode": "Builder.LexiconController.CreateTemplateLexicon.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[description]",
        "Solution": _l("Please contact the developers.")
    },
    "Builder.LexiconService.CreateTemplateLexicon.KnwIdNotExist": {
        "ErrorCode": "Builder.LexiconService.CreateTemplateLexicon.KnwIdNotExist",
        "Description": _l('knowledge network id [knw_id] not exists'),
        "ErrorDetails": _l('knowledge network id [knw_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.CreateTemplateLexicon.KnAddLexiconError": {
        "ErrorCode": "Builder.LexiconService.CreateTemplateLexicon.KnAddLexiconError",
        "Description": _l('The user does not have permission to create a lexicon.'),
        "ErrorDetails": _l('The user does not have permission to create a lexicon.'),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.CreateTemplateLexicon.DuplicatedName": {
        "ErrorCode": "Builder.LexiconService.CreateTemplateLexicon.DuplicatedName",
        "Description": _l("Lexicon name [name] already exists and cannot be created repeatedly."),
        "ErrorDetails": _l("Lexicon name [name] already exists and cannot be created repeatedly."),
        "Solution": _l("Please check your parameter again.")
    },

    "Builder.LexiconController.BuildTask.ParamError": {
        "ErrorCode": "Builder.LexiconController.BuildTask.ParamError",
        "Description": '[message]',
        "ErrorDetails": '[message]',
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.BuildTask.UnknownError": {
        "ErrorCode": "Builder.LexiconController.BuildTask.UnknownError",
        "Description": "[description]",
        "ErrorDetails": "[description]",
        "Solution": _l("Please contact the developers.")
    },
    "Builder.LexiconService.BuildTask.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconService.BuildTask.LexiconIdNotExist",
        "Description": _l('lexicon id [lexicon_id] not exists'),
        "ErrorDetails": _l('lexicon id [lexicon_id] not exists'),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.BuildTask.PermissionError": {
        "ErrorCode": "Builder.LexiconService.BuildTask.PermissionError",
        "Description": _l("The user don't have permission to build lexicon."),
        "ErrorDetails": _l("The user don't have permission to build lexicon."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.BuildTask.LexiconIsRunning": {
        "ErrorCode": "Builder.LexiconService.BuildTask.LexiconIsRunning",
        "Description": _l("task cannot run, the current lexicon is running or waiting."),
        "ErrorDetails": _l("task cannot run, the current lexicon is running or waiting."),
        "Solution": _l("Please try again after the task ends.")
    },
    "Builder.LexiconService.BuildTask.ExtractInfoEmptyError": {
        "ErrorCode": "Builder.LexiconService.BuildTask.ExtractInfoEmptyError",
        "Description": _l("lexicon extract info is empty."),
        "ErrorDetails": _l("lexicon extract info is empty."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.BuildTask.KnowledgeCapacityError": {
        "ErrorCode": "Builder.LexiconService.BuildTask.KnowledgeCapacityError",
        "Description": _l("Insufficient available capacity;"),
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please improve your knowledge capacity.")
    },
    "Builder.LexiconService.BuildTask.AsyncTaskInternalError": {
        "ErrorCode": "Builder.LexiconService.BuildTask.AsyncTaskInternalError",
        "Description": _l("async task service internal error"),
        "ErrorDetails": _l("[message]"),
        "Solution": _l("Please contact the developers.")
    },
    "Builder.LexiconService.BuildTask.ExtractLexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconService.BuildTask.ExtractLexiconIdNotExist",
        "Description": _l("The lexicon id [ids] in the extract_info does not exist."),
        "ErrorDetails": _l("The lexicon id [ids] in the extract_info does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.BuildTask.ExtractGraphIdNotExist": {
        "ErrorCode": "Builder.LexiconService.BuildTask.ExtractGraphIdNotExist",
        "Description": _l("The graph id [ids] in the extract_info does not exist."),
        "ErrorDetails": _l("The graph id [ids] in the extract_info does not exist."),
        "Solution": _l("Please check your parameter again.")
    },

    "Builder.LexiconController.GetLabels.ParamError": {
        "ErrorCode": "Builder.LexiconController.GetLabels.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.GetLabels.KnowledgeIdNotExist": {
        "ErrorCode": "Builder.LexiconController.GetLabels.KnowledgeIdNotExist",
        "Description": "Invalid knowledge_id",
        "ErrorDetails": _l("The specified knowledge_id [knowledge_id] does not exist, get labels failed!"),
        "Solution": _l("Please check your parameter again.")
    },

    "Builder.LexiconController.GetLexiconList.ParamError": {
        "ErrorCode": "Builder.LexiconController.GetLexiconList.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.GetLexiconList.KnowledgeIdNotExist": {
        "ErrorCode": "Builder.LexiconController.GetLexiconList.KnowledgeIdNotExist",
        "Description": "Invalid knowledge_id",
        "ErrorDetails": _l("The specified knowledge_id [knowledge_id] does not exist, get lexicon failed!"),
        "Solution": _l("Please check your parameter again.")
    },

    "Builder.LexiconController.GetLexiconById.ParamError": {
        "ErrorCode": "Builder.LexiconController.GetLexiconById.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.GetLexiconById.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.GetLexiconById.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist, get lexicon failed!"),
        "Solution": _l("Please check your parameter again.")
    },

    "Builder.LexiconController.InsertLexiconWord.ParamError": {
        "ErrorCode": "Builder.LexiconController.InsertLexiconWord.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.InsertLexiconWord.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.InsertLexiconWord.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.InsertLexiconWord.FormatMismatch": {
        "ErrorCode": "Builder.LexiconController.InsertLexiconWord.FormatMismatch",
        "Description": "word format conflict",
        "ErrorDetails": _l("The format of the new data [data] does not match the original data"),
        "Solution": _l("Please check lexicon format again.")
    },
    "Builder.LexiconController.InsertLexiconWord.WordExisted": {
        "ErrorCode": "Builder.LexiconController.InsertLexiconWord.WordExisted",
        "Description": "The newly added word info already exists",
        "ErrorDetails": _l("The newly added word [data] already exists."),
        "Solution": _l("Please check lexicon format again.")
    },
    "Builder.LexiconController.InsertLexiconWord.InvalidStatus": {
        "ErrorCode": "Builder.LexiconController.InsertLexiconWord.InvalidStatus",
        "Description": "Lexicon status is not compliant.",
        "ErrorDetails": _l("lexicon [lexicon_id] status is running, cannot insert."),
        "Solution": _l("lexicon status is running, please make sure lexicon status is correct.")
    },

    "Builder.LexiconController.SearchLexiconWord.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.SearchLexiconWord.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.SearchLexiconWord.ParamError": {
        "ErrorCode": "Builder.LexiconController.SearchLexiconWord.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },

    "Builder.LexiconController.EditLexiconWord.ParamError": {
        "ErrorCode": "Builder.LexiconController.EditLexiconWord.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.EditLexiconWord.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.EditLexiconWord.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.EditLexiconWord.LexiconWordNotExist": {
        "ErrorCode": "Builder.LexiconController.EditLexiconWord.LexiconWordNotExist",
        "Description": "Invalid word info",
        "ErrorDetails": _l("The specified lexicon word [lexicon_word] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.EditLexiconWord.FormatMismatch": {
        "ErrorCode": "Builder.LexiconController.EditLexiconWord.FormatMismatch",
        "Description": "word format conflict",
        "ErrorDetails": _l("New data [new_info] and original data [old_info] fields are inconsistent."),
        "Solution": _l("Please check lexicon format again.")
    },
    "Builder.LexiconController.EditLexiconWord.LexiconWordExisted": {
        "ErrorCode": "Builder.LexiconController.EditLexiconWord.LexiconWordExisted",
        "Description": "The modified word already exists.",
        "ErrorDetails": _l("The modified word [lexicon_word] already exists."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.EditLexiconWord.InvalidStatus": {
        "ErrorCode": "Builder.LexiconController.EditLexiconWord.InvalidStatus",
        "Description": "Lexicon status is not compliant.",
        "ErrorDetails": _l("lexicon [lexicon_id] status is running, cannot edit word."),
        "Solution": _l("lexicon status is running, please make sure lexicon status is correct.")
    },

    "Builder.LexiconController.DeleteLexiconWord.ParamError": {
        "ErrorCode": "Builder.LexiconController.DeleteLexiconWord.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.DeleteLexiconWord.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.DeleteLexiconWord.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.DeleteLexiconWord.WordNotExist": {
        "ErrorCode": "Builder.LexiconController.DeleteLexiconWord.WordNotExist",
        "Description": "Deleted data does not exist",
        "ErrorDetails": _l("There is no deleted data [delete_data] in the specified lexicon."),
        "Solution": _l("Please check lexicon format again.")
    },
    "Builder.LexiconController.DeleteLexiconWord.InvalidStatus": {
        "ErrorCode": "Builder.LexiconController.DeleteLexiconWord.InvalidStatus",
        "Description": "Lexicon status is not compliant.",
        "ErrorDetails": _l("lexicon [lexicon_id] status is running, cannot delete word."),
        "Solution": _l("lexicon status is running, please make sure lexicon status is correct.")
    },

    # 编辑词库基本信息
    "Builder.LexiconController.EditLexicon.ParamError": {
        "ErrorCode": "Builder.LexiconController.EditLexicon.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.EditLexicon.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconService.EditLexicon.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.EditLexicon.LexiconPermError": {
        "ErrorCode": "Builder.LexiconService.EditLexicon.LexiconPermError",
        "Description": _l("Don't have permission to view lexicon [lexicon_ids]."),
        "ErrorDetails": _l("Don't have permission to view lexicon [lexicon_ids]."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.EditLexicon.GraphPermError": {
        "ErrorCode": "Builder.LexiconService.EditLexicon.GraphPermError",
        "Description": _l("Don't have permission to view graph [graph_ids]."),
        "ErrorDetails": _l("Don't have permission to view graph [graph_ids]."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.EditLexicon.ExtractError": {
        "ErrorCode": "Builder.LexiconService.EditLexicon.ExtractError",
        "Description": _l("Only participle template support extract lexicon."),
        "ErrorDetails": _l("Only participle template support extract lexicon."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.EditLexicon.SeparatorError": {
        "ErrorCode": "Builder.LexiconService.EditLexicon.SeparatorError",
        "Description": _l("Standard word attribute cannot set a separator."),
        "ErrorDetails": _l("Standard word attribute cannot set a separator."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder_LexiconService_EditLexicon_DuplicatedName": {
        "ErrorCode": "Builder_LexiconService_EditLexicon_DuplicatedName",
        "Description": "Duplicate lexicon name",
        "ErrorDetails": _l("Lexicon name [lexicon_name] already exists and cannot be created repeatedly."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconService.EditLexicon.UnknownError": {
        "ErrorCode": "Builder.LexiconService.EditLexicon.UnknownError",
        "Description": "[err]",
        "ErrorDetails": "[err]",
        "Solution": _l("Please contact the developers.")
    },
    "Builder.LexiconService.EditLexicon.LexiconIsRunning": {
        "ErrorCode": "Builder.LexiconService.EditLexicon.LexiconIsRunning",
        "Description": _l("the current lexicon is running or waiting."),
        "ErrorDetails": _l("the current lexicon is running or waiting."),
        "Solution": _l("Please try again after the task ends.")
    },

    # 删除词库
    "Builder.LexiconController.DeleteLexicon.ParamError": {
        "ErrorCode": "Builder.LexiconController.DeleteLexicon.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.DeleteLexicon.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.DeleteLexicon.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    # 导出词库
    "Builder.LexiconController.ExportLexicon.ParamError": {
        "ErrorCode": "Builder.LexiconController.ExportLexicon.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.ExportLexicon.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.ExportLexicon.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.ExportLexicon.EmptyLexicon": {
        "ErrorCode": "Builder.LexiconController.ExportLexicon.EmptyLexicon",
        "Description": "Empty lexicon",
        "ErrorDetails": "Empty lexicon cannot be exported, please add word first.",
        "Solution": "Please add the lexicon manually or import the lexicon from the file."
    },
    "Builder.LexiconController.ExportLexicon.InvalidStatus": {
        "ErrorCode": "Builder.LexiconController.ExportLexicon.InvalidStatus",
        "Description": "Lexicon status is not compliant.",
        "ErrorDetails": _l("lexicon [lexicon_id] status is running, cannot export."),
        "Solution": _l("lexicon status is running, please make sure lexicon status is correct.")
    },
    # 下载模板
    "Builder.LexiconController.DownloadTemplate.ParamError": {
        "ErrorCode": "Builder.LexiconController.DownloadTemplate.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.DownloadTemplate.DownloadFailed": {
        "ErrorCode": "Builder.LexiconController.DownloadTemplate.DownloadFailed",
        "Description": "Failed to download lexicon template file",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please see the error prompt for details.")
    },

    # 词云图
    "Builder.LexiconController.WordCloud.ParamError": {
        "ErrorCode": "Builder.LexiconController.WordCloud.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.WordCloud.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.WordCloud.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    # 词库中导入词汇
    "Builder.LexiconController.ImportWord2Lexicon.ParamError": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.FileUploadFailed": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.FileUploadFailed",
        "Description": "File upload failed",
        "ErrorDetails": _l("[ErrorDetails]"),
        "Solution": _l("Please check the type and size of the uploaded file.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.FormatMismatch": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.FormatMismatch",
        "Description": "word format conflict",
        "ErrorDetails": _l("New data and original data fields are inconsistent"),
        "Solution": _l("Please check lexicon format again.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.FilesNumberExceeded": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.FilesNumberExceeded",
        "Description": "File upload failed",
        "ErrorDetails": _l("Only one file can be selected at most."),
        "Solution": _l("Please select upload file again.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.FileFormatError": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.FileFormatError",
        "Description": "File upload failed, file format error",
        "ErrorDetails": _l("The file format only supports txt and CSV."),
        "Solution": _l("Please select upload file again.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.ContentFormatError": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.ContentFormatError",
        "Description": "File upload failed, file content format error",
        "ErrorDetails": _l("File content format error."),
        "Solution": _l("Please check the content and format of the document according to the template.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.EncodingError": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.EncodingError",
        "Description": "File upload failed, file encoding error",
        "ErrorDetails": _l("The file only supports UTF-8 encoding."),
        "Solution": _l("Please confirm the file code and reselect the file.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.FileEmptyError": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.FileEmptyError",
        "Description": "Upload file cannot be empty",
        "ErrorDetails": _l("Select at least one file."),
        "Solution": _l("Please select upload file again.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.DataExceeded": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.DataExceeded",
        "Description": "File upload failed, data amount exceeds",
        "ErrorDetails": _l("The amount of uploaded file data exceeds."),
        "Solution": _l("The uploaded file must be less than 10M and the number of lines must be less than 350000.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.InvalidStatus": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.InvalidStatus",
        "Description": "Lexicon status is not compliant.",
        "ErrorDetails": _l("lexicon [lexicon_id] status is running, cannot import words."),
        "Solution": _l("lexicon status is running, please make sure lexicon status is correct.")
    },
    "Builder.LexiconController.ImportWord2Lexicon.AsyncTaskInternalError": {
        "ErrorCode": "Builder.LexiconController.ImportWord2Lexicon.AsyncTaskInternalError",
        "Description": _l("async task service internal error"),
        "ErrorDetails": _l("[detail]"),
        "Solution": _l("Please contact the developers.")
    },
    # 词云图中搜索
    "Builder.LexiconController.WordCloudSearch.ParamError": {
        "ErrorCode": "Builder.LexiconController.WordCloudSearch.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.WordCloudSearch.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.WordCloudSearch.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    # 下载单个词库
    "Builder.LexiconController.DownloadLexicon.ParamError": {
        "ErrorCode": "Builder.LexiconController.DownloadLexicon.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": "Please check your parameter again."
    },
    "Builder.LexiconController.DownloadLexicon.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.DownloadLexicon.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": "The specified lexicon id [lexicon_id] does not exist.",
        "Solution": "Please check your parameter again."
    },
    "Builder.LexiconController.DownloadLexicon.InternalError": {
        "ErrorCode": "Builder.LexiconController.DownloadLexicon.InternalError",
        "Description": "InternalError",
        "ErrorDetails": "Download [lexicon_id] InternalError",
        "Solution": "Please retry again or contact administrator."
    },
    "Builder.LexiconController.DownloadLexicon.InvalidStatus": {
        "ErrorCode": "Builder.LexiconController.DownloadLexicon.InvalidStatus",
        "Description": "Lexicon status is not compliant.",
        "ErrorDetails": "lexicon [lexicon_id] status is running, cannot download.",
        "Solution": "lexicon status is running, please make sure lexicon status is correct."
    },
    "Builder.LexiconController.DownloadLexicon.EmptyLexicon": {
        "ErrorCode": "Builder.LexiconController.DownloadLexicon.EmptyLexicon",
        "Description": "The lexicon is empty",
        "ErrorDetails": "lexicon [lexicon_id] is empty.",
        "Solution": "Please check your lexicon again."
    },
    # 天辰生成词库
    "Builder.LexiconController.CreateSynonym.GetFileError": {
        "ErrorCode": "Builder.LexiconController.CreateLexicon.GetFileError",
        "Description": "Get File Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": "Please check your file parameter again."
    },
    "Builder.LexiconController.CreateSynonym.ParamError": {
        "ErrorCode": "Builder.LexiconController.CreateSynonym.ParamError",
        "Description": "Parameter Error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": "Please check your parameter again."
    },
    "Builder.lexiconController.CreateSynonym.FileTypeError": {
        "ErrorCode": "Builder.lexiconController.CreateSynonym.FileTypeError",
        "Description": "File type error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": "Please check your parameter again."
    },
    "Builder.LexiconController.CreateSynonym.GraphIdNotExist": {
        "ErrorCode": "Builder.LexiconController.CreateSynonym.GraphIdNotExist",
        "Description": "Graph id invalid",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": "Please check your parameter again."
    },
    "Builder.LexiconController.CreateSynonym.MatchError": {
        "ErrorCode": "Builder.LexiconController.CreateSynonym.MatchError",
        "Description": "Create synonym error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": "Please check your attribute thesaurus or graph id again."
    },
    "Builder.LexiconController.CreateSynonym.ReadDsError": {
        "ErrorCode": "Builder.LexiconController.CreateSynonym.ReadDsError",
        "Description": "Create synonym error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": "Please check your data source network or configuration is incorrect."
    }
}
