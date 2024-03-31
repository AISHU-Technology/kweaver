/**
 * 词库相关接口
 */
import { API } from '@/services/api';
import apiService from '@/utils/axios-http/oldIndex';
import apiServiceEngine from '@/utils/axios-http/engineServer';
import { message } from 'antd';
import intl from 'react-intl-universal';

const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.ExportLexicon.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconController.ExportLexicon.EmptyLexicon': 'ThesaurusManage.emptyWords',
  'Builder.LexiconController.ExportLexicon.InvalidStatus': 'ThesaurusManage.editwordsError'
};
// 获取词库列表接口
const thesaurusList = async (data: any) => {
  return await apiService.axiosGetData(API.thesaurusList, data);
};

// 词库id查找词库接口
const thesaurusInfoBasic = async (data: any) => await apiService.axiosGetData(API.thesaurusInfoBasic, data);

// 新建词库接口
const thesaurusCreate = async (data: any) => {
  return await apiService.axiosPost(
    API.thesaurusCreate,
    { type: 'file', ...data },
    { headers: { knowledge_id: data?.knowledge_id }, timeout: 30000 }
  );
};

/**
 * 根据模板创建词库
 */
const thesaurusTemplateLexicon = async (data: any) => {
  return await apiService.axiosPost(API.thesaurusTemplateLexicon, data);
};

// 获取候选标签接口
const thesaurusLabelList = async (data: any) => await apiService.axiosGetData(API.thesaurusLabelList, data);

// 词库导出接口
const thesaurusExport = async (data: any) => {
  try {
    const result = await apiService.axiosPost(API.thesaurusExport, data, { responseType: 'blob' });

    if (!result) return;

    if (result.type === 'application/json') {
      const fileReader = new FileReader();
      const blob2 = new Blob([result], {
        type: 'application/json'
      });
      fileReader.readAsText(blob2, 'utf-8');

      fileReader.onload = function () {
        const msg = JSON.parse(fileReader.result as string);
        if (msg?.ErrorCode === 'Builder.LexiconController.ExportLexicon.InvalidStatus') {
          message.warning(intl.get(ERROR_CODE[msg?.ErrorCode]));
          return;
        }
        if (msg?.ErrorCode) {
          ERROR_CODE[msg?.ErrorCode]
            ? message.error(intl.get(ERROR_CODE[msg?.ErrorCode]))
            : message.error(msg?.Description);
        }
      };
      return false;
    }
    const csvType = 'application/zip;charset-UTF-8';
    const blob = new Blob([result], { type: csvType }); // 指定格式
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '词库.zip'; // 指定导出名称
    link.click();
    URL.revokeObjectURL(link.href);
    return true;
  } catch (err) {
    //
  }
};

// 词库中新增词汇接口
const thesaurusInsertWords = async (data: any) => await apiService.axiosPost(API.thesaurusInsertWords, data);

// 词库中搜索词汇接口
const thesaurusSearchWords = async (data: any) => await apiService.axiosPost(API.thesaurusSearchWords, data);

// 词库中编辑词汇接口
const thesaurusEditWords = async (data: any) => await apiService.axiosPost(API.thesaurusEditWords, data);

// 词库中删除词汇接口
const thesaurusDeleteWords = async (data: any) => await apiService.axiosPost(API.thesaurusDeleteWords, data);

// 编辑词库信息接口
const thesaurusEdit = async (data: any) => await apiService.axiosPost(API.thesaurusEdit, data);

// 删除词库信息接口
const thesaurusDelete = async (data: any) => await apiService.axiosPost(API.thesaurusDelete, data);

// 词库内导入词汇接口
const thesaurusImportWords = async (data: any) => {
  return await apiService.axiosPost(
    API.thesaurusImportWords,
    { type: 'file', ...data },
    { headers: { id: data?.id }, timeout: 300000 }
  );
};

// 词库模板下载接口
const downloadTemplate = async () => {
  const result = await apiService.axiosPost(API.downloadTemplate, {}, { responseType: 'blob' });

  if (!result) return;

  if (result?.ErrorCode) return result;
  const csvType = 'application/zip;charset-UTF-8';
  const blob = new Blob([result], { type: csvType }); // 指定格式
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '模板.zip'; // 指定导出名称
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * 词库构建
 */
const thesaurusBuild = async (data: any) => await apiService.axiosPost(API.thesaurusBuild, data);

export default {
  thesaurusList,
  thesaurusInfoBasic,
  thesaurusCreate,
  thesaurusLabelList,
  thesaurusExport,
  thesaurusInsertWords,
  thesaurusSearchWords,
  thesaurusEditWords,
  thesaurusDeleteWords,
  thesaurusEdit,
  thesaurusDelete,
  thesaurusImportWords,
  downloadTemplate,
  thesaurusTemplateLexicon,
  thesaurusBuild
};
