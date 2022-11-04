# -*- coding: utf-8 -*-
from flask_babel import gettext as _l

errDict = {
    "Builder.LexiconController.DatabaseError": {
        "ErrorCode": "Builder.LexiconController.DatabaseError",
        "Description": "Database error",
        "ErrorDetails": "[ErrorDetails]",
        "Solution": _l("Please check the database connection.")
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
    "Builder.LexiconController.EditLexicon.LexiconIdNotExist": {
        "ErrorCode": "Builder.LexiconController.EditLexicon.LexiconIdNotExist",
        "Description": "Invalid lexicon id",
        "ErrorDetails": _l("The specified lexicon id [lexicon_id] does not exist."),
        "Solution": _l("Please check your parameter again.")
    },
    "Builder.LexiconController.EditLexicon.DuplicatedName": {
        "ErrorCode": "Builder.LexiconController.EditLexicon.DuplicatedName",
        "Description": "Duplicate lexicon name",
        "ErrorDetails": _l("Lexicon name [lexicon_name] already exists and cannot be created repeatedly."),
        "Solution": _l("Please check your parameter again.")
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
}
