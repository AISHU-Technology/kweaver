/**
 * 词库相关接口
 */
import { API } from '@/services/api';
import apiService from '@/utils/axios-http/oldIndex';
import { message } from 'antd';
import intl from 'react-intl-universal';

const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.ExportLexicon.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconController.ExportLexicon.EmptyLexicon': 'ThesaurusManage.emptyWords',
  'Builder.LexiconController.ExportLexicon.InvalidStatus': 'ThesaurusManage.editwordsError'
};
const thesaurusList = async (data: any) => {
  return await apiService.axiosGetData(API.thesaurusList, data);
};

const thesaurusInfoBasic = async (data: any) => await apiService.axiosGetData(API.thesaurusInfoBasic, data);

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

const thesaurusLabelList = async (data: any) => await apiService.axiosGetData(API.thesaurusLabelList, data);

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
    const blob = new Blob([result], { type: csvType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '词库.zip';
    link.click();
    URL.revokeObjectURL(link.href);
    return true;
  } catch (err) {}
};

const thesaurusInsertWords = async (data: any) => await apiService.axiosPost(API.thesaurusInsertWords, data);

const thesaurusSearchWords = async (data: any) => await apiService.axiosPost(API.thesaurusSearchWords, data);

const thesaurusEditWords = async (data: any) => await apiService.axiosPost(API.thesaurusEditWords, data);

const thesaurusDeleteWords = async (data: any) => await apiService.axiosPost(API.thesaurusDeleteWords, data);

const thesaurusEdit = async (data: any) => await apiService.axiosPost(API.thesaurusEdit, data);

const thesaurusDelete = async (data: any) => await apiService.axiosPost(API.thesaurusDelete, data);

const thesaurusImportWords = async (data: any) => {
  return await apiService.axiosPost(
    API.thesaurusImportWords,
    { type: 'file', ...data },
    { headers: { id: data?.id }, timeout: 300000 }
  );
};

const downloadTemplate = async () => {
  const result = await apiService.axiosPost(API.downloadTemplate, {}, { responseType: 'blob' });

  if (!result) return;

  if (result?.ErrorCode) return result;
  const csvType = 'application/zip;charset-UTF-8';
  const blob = new Blob([result], { type: csvType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '模板.zip';
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
