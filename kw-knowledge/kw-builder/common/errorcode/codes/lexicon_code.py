# -*- coding: utf-8 -*-
'''
@Author ：Jay.zhu
@Date ：2022/8/13 10:57
'''
from __future__ import (absolute_import, unicode_literals)
# 数据库异常
Builder_LexiconController_DatabaseError = "Builder.LexiconController.DatabaseError"

# 知识量不足
Builder_LexiconController_KnowledgeCapacityError = "Builder.LexiconController.KnowledgeCapacityError"

# 新建词库
Builder_LexiconController_CreateLexicon_ParamError = "Builder.LexiconController.CreateLexicon.ParamError"
Builder_LexiconController_CreateLexicon_KnowledgeIdNotExist = "Builder.LexiconController.CreateLexicon.KnowledgeIdNotExist"
Builder_LexiconController_CreateLexicon_DuplicatedName = "Builder.LexiconController.CreateLexicon.DuplicatedName"
Builder_LexiconController_CreateLexicon_FileUploadError = "Builder.LexiconController.CreateLexicon.FileUploadError"
Builder_LexiconController_CreateLexicon_FilesNumberExceeded = "Builder.LexiconController.CreateLexicon.FilesNumberExceeded"
Builder_LexiconController_CreateLexicon_FileFormatError = "Builder.LexiconController.CreateLexicon.FileFormatError"
Builder_LexiconController_CreateLexicon_ContentFormatError = "Builder.LexiconController.CreateLexicon.ContentFormatError"
Builder_LexiconController_CreateLexicon_EncodingError = "Builder.LexiconController.CreateLexicon.EncodingError"
Builder_LexiconController_CreateLexicon_DataExceeded = "Builder.LexiconController.CreateLexicon.DataExceeded"
Builder_LexiconController_CreateLexicon_AsyncTaskInternalError = "Builder.LexiconController.CreateLexicon.AsyncTaskInternalError"

# 根据模板新建词库
Builder_LexiconController_CreateTemplateLexicon_ParamError = "Builder.LexiconController.CreateTemplateLexicon.ParamError"
Builder_LexiconController_CreateTemplateLexicon_UnknownError = "Builder.LexiconController.CreateTemplateLexicon.UnknownError"
Builder_LexiconService_CreateTemplateLexicon_KnwIdNotExist = "Builder.LexiconService.CreateTemplateLexicon.KnwIdNotExist"
Builder_LexiconService_CreateTemplateLexicon_KnAddLexiconError = "Builder.LexiconService.CreateTemplateLexicon.KnAddLexiconError"
Builder_LexiconService_CreateTemplateLexicon_DuplicatedName = "Builder.LexiconService.CreateTemplateLexicon.DuplicatedName"

# 词库构建任务
Builder_LexiconController_BuildTask_ParamError = "Builder.LexiconController.BuildTask.ParamError"
Builder_LexiconController_BuildTask_UnknownError = "Builder.LexiconController.BuildTask.UnknownError"
Builder_LexiconService_BuildTask_LexiconIdNotExist = "Builder.LexiconService.BuildTask.LexiconIdNotExist"
Builder_LexiconService_BuildTask_PermissionError = "Builder.LexiconService.BuildTask.PermissionError"
Builder_LexiconService_BuildTask_LexiconIsRunning = "Builder.LexiconService.BuildTask.LexiconIsRunning"
Builder_LexiconService_BuildTask_ExtractInfoEmptyError = "Builder.LexiconService.BuildTask.ExtractInfoEmptyError"
Builder_LexiconService_BuildTask_KnowledgeCapacityError = "Builder.LexiconService.BuildTask.KnowledgeCapacityError"
Builder_LexiconService_BuildTask_AsyncTaskInternalError = "Builder.LexiconService.BuildTask.AsyncTaskInternalError"
Builder_LexiconService_BuildTask_ExtractLexiconIdNotExist = "Builder.LexiconService.BuildTask.ExtractLexiconIdNotExist"
Builder_LexiconService_BuildTask_ExtractGraphIdNotExist = "Builder.LexiconService.BuildTask.ExtractGraphIdNotExist"

# 获取词库标签
Builder_LexiconController_GetLabels_ParamError = "Builder.LexiconController.GetLabels.ParamError"
Builder_LexiconController_GetLabels_KnowledgeIdNotExist = "Builder.LexiconController.GetLabels.KnowledgeIdNotExist"

# 获取词库列表
Builder_LexiconController_GetLexiconList_ParamError = "Builder.LexiconController.GetLexiconList.ParamError"
Builder_LexiconController_GetLexiconList_KnowledgeIdNotExist = "Builder.LexiconController.GetLexiconList.KnowledgeIdNotExist"

# 根据词库id查询词库信息
Builder_LexiconController_GetLexiconById_ParamError = "Builder.LexiconController.GetLexiconById.ParamError"
Builder_LexiconController_GetLexiconById_LexiconIdNotExist = "Builder.LexiconController.GetLexiconById.LexiconIdNotExist"

# 词库中插入词汇
Builder_LexiconController_InsertLexiconWord_ParamError = "Builder.LexiconController.InsertLexiconWord.ParamError"
Builder_LexiconController_InsertLexiconWord_LexiconIdNotExist = "Builder.LexiconController.InsertLexiconWord.LexiconIdNotExist"
Builder_LexiconController_InsertLexiconWord_FormatMismatch = "Builder.LexiconController.InsertLexiconWord.FormatMismatch"
Builder_LexiconController_InsertLexiconWord_WordExisted = "Builder.LexiconController.InsertLexiconWord.WordExisted"
Builder_LexiconController_InsertLexiconWord_InvalidStatus = "Builder.LexiconController.InsertLexiconWord.InvalidStatus"

# 词库中搜索词汇
Builder_LexiconController_SearchLexiconWord_ParamError = "Builder.LexiconController.SearchLexiconWord.ParamError"
Builder_LexiconController_SearchLexiconWord_LexiconIdNotExist = "Builder.LexiconController.SearchLexiconWord.LexiconIdNotExist"

# 词库中编辑词汇
Builder_LexiconController_EditLexiconWord_ParamError = "Builder.LexiconController.EditLexiconWord.ParamError"
Builder_LexiconController_EditLexiconWord_LexiconIdNotExist = "Builder.LexiconController.EditLexiconWord.LexiconIdNotExist"
Builder_LexiconController_EditLexiconWord_LexiconWordNotExist = "Builder.LexiconController.EditLexiconWord.LexiconWordNotExist"
Builder_LexiconController_EditLexiconWord_FormatMismatch = "Builder.LexiconController.EditLexiconWord.FormatMismatch"
Builder_LexiconController_EditLexiconWord_LexiconWordExisted = "Builder.LexiconController.EditLexiconWord.LexiconWordExisted"
Builder_LexiconController_EditLexiconWord_InvalidStatus = "Builder.LexiconController.EditLexiconWord.InvalidStatus"

# 词库中删除词汇
Builder_LexiconController_DeleteLexiconWord_ParamError = "Builder.LexiconController.DeleteLexiconWord.ParamError"
Builder_LexiconController_DeleteLexiconWord_LexiconIdNotExist = "Builder.LexiconController.DeleteLexiconWord.LexiconIdNotExist"
Builder_LexiconController_DeleteLexiconWord_WordNotExist = "Builder.LexiconController.DeleteLexiconWord.WordNotExist"
Builder_LexiconController_DeleteLexiconWord_InvalidStatus = "Builder.LexiconController.DeleteLexiconWord.InvalidStatus"

# 编辑词库基本信息
Builder_LexiconController_EditLexicon_ParamError = "Builder.LexiconController.EditLexicon.ParamError"
Builder_LexiconService_EditLexicon_LexiconIdNotExist = "Builder.LexiconService.EditLexicon.LexiconIdNotExist"
Builder_LexiconService_EditLexicon_LexiconPermError = "Builder.LexiconService.EditLexicon.LexiconPermError"
Builder_LexiconService_EditLexicon_GraphPermError = "Builder.LexiconService.EditLexicon.GraphPermError"
Builder_LexiconService_EditLexicon_ExtractError = "Builder.LexiconService.EditLexicon.ExtractError"
Builder_LexiconService_EditLexicon_SeparatorError = "Builder.LexiconService.EditLexicon.SeparatorError"
Builder_LexiconService_EditLexicon_DuplicatedName = "Builder_LexiconService_EditLexicon_DuplicatedName"
Builder_LexiconService_EditLexicon_UnknownError = "Builder.LexiconService.EditLexicon.UnknownError"
Builder_LexiconService_EditLexicon_LexiconIsRunning = "Builder.LexiconService.EditLexicon.LexiconIsRunning"

# 删除词库
Builder_LexiconController_DeleteLexicon_ParamError = "Builder.LexiconController.DeleteLexicon.ParamError"
Builder_LexiconController_DeleteLexicon_LexiconIdNotExist = "Builder.LexiconController.DeleteLexicon.LexiconIdNotExist"

# 导出词库
Builder_LexiconController_ExportLexicon_ParamError = "Builder.LexiconController.ExportLexicon.ParamError"
Builder_LexiconController_ExportLexicon_LexiconIdNotExist = "Builder.LexiconController.ExportLexicon.LexiconIdNotExist"
Builder_LexiconController_ExportLexicon_EmptyLexicon = "Builder.LexiconController.ExportLexicon.EmptyLexicon"
Builder_LexiconController_ExportLexicon_InvalidStatus = "Builder.LexiconController.ExportLexicon.InvalidStatus"


# 下载模板
Builder_LexiconController_DownloadTemplate_ParamError = "Builder.LexiconController.DownloadTemplate.ParamError"
Builder_LexiconController_DownloadTemplate_DownoladFailed = "Builder.LexiconController.DownloadTemplate.DownloadFailed"

# 词云图
Builder_LexiconController_WordCloud_ParamError = "Builder.LexiconController.WordCloud.ParamError"
Builder_LexiconController_WordCloud_LexiconIdNotExist = "Builder.LexiconController.WordCloud.LexiconIdNotExist"

# 词库中导入词汇
Builder_LexiconController_ImportWord2Lexicon_ParamError = "Builder.LexiconController.ImportWord2Lexicon.ParamError"
Builder_LexiconController_ImportWord2Lexicon_LexiconIdNotExist = "Builder.LexiconController.ImportWord2Lexicon.LexiconIdNotExist"
Builder_LexiconController_ImportWord2Lexicon_FileUploadFailed = "Builder.LexiconController.ImportWord2Lexicon.FileUploadFailed"
Builder_LexiconController_ImportWord2Lexicon_FormatMismatch = "Builder.LexiconController.ImportWord2Lexicon.FormatMismatch"
Builder_LexiconController_ImportWord2Lexicon_FilesNumberExceeded = "Builder.LexiconController.ImportWord2Lexicon.FilesNumberExceeded"
Builder_LexiconController_ImportWord2Lexicon_FileFormatError = "Builder.LexiconController.ImportWord2Lexicon.FileFormatError"
Builder_LexiconController_ImportWord2Lexicon_ContentFormatError = "Builder.LexiconController.ImportWord2Lexicon.ContentFormatError"
Builder_LexiconController_ImportWord2Lexicon_EncodingError = "Builder.LexiconController.ImportWord2Lexicon.EncodingError"
Builder_LexiconController_ImportWord2Lexicon_FileEmptyError = "Builder.LexiconController.ImportWord2Lexicon.FileEmptyError"
Builder_LexiconController_ImportWord2Lexicon_DataExceeded = "Builder.LexiconController.ImportWord2Lexicon.DataExceeded"
Builder_LexiconController_ImportWord2Lexicon_InvalidStatus = "Builder.LexiconController.ImportWord2Lexicon.InvalidStatus"
Builder_LexiconController_ImportWord2Lexicon_AsyncTaskInternalError = "Builder.LexiconController.ImportWord2Lexicon.AsyncTaskInternalError"

# 词云图中搜索
Builder_LexiconController_WordCloudSearch_ParamError = "Builder.LexiconController.WordCloudSearch.ParamError"
Builder_LexiconController_WordCloudSearch_LexiconIdNotExist = "Builder.LexiconController.WordCloudSearch.LexiconIdNotExist"

# 下载词库
Builder_LexiconController_DownloadLexicon_ParamError = "Builder.LexiconController.DownloadLexicon.ParamError"
Builder_LexiconController_DownloadLexicon_LexiconIdNotExist = "Builder.LexiconController.DownloadLexicon.LexiconIdNotExist"
Builder_LexiconController_DownloadLexicon_InvalidStatus = "Builder.LexiconController.DownloadLexicon.InvalidStatus"
Builder_LexiconController_DownloadLexicon_InternalError = "Builder.LexiconController.DownloadLexicon.InternalError"
Builder_LexiconController_DownloadLexicon_EmptyLexicon = "Builder.LexiconController.DownloadLexicon.EmptyLexicon"

#天辰词库工具生成
Builder_LexiconController_CreateSynonym_GetFileError="Builder.LexiconController.CreateSynonym.GetFileError"
Builder_LexiconController_CreateSynonym_ParamError="Builder.LexiconController.CreateSynonym.ParamError"
Builder_LexiconController_CreateSynonym_FileTypeError="Builder.lexiconController.CreateSynonym.FileTypeError"
Builder_LexiconController_CreateSynonym_GraphIdNotExist="Builder.LexiconController.CreateSynonym.GraphIdNotExist"
Builder_LexiconController_CreateSynonym_MatchError="Builder.LexiconController.CreateSynonym.MatchError"
Builder_LexiconController_CreateSynonym_ReadDsError="Builder.LexiconController.CreateSynonym.ReadDsError"