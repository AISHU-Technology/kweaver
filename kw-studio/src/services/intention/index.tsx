import { API } from '@/services/api';
import apiService from '@/utils/axios-http/engineServer';
import { request } from '@/utils/axios-http/trialRequest';
import intl from 'react-intl-universal';
/*  */
/**
 * 获取意图池列表
 */
type GetIntentPoolListType = {
  page: number;
  size: number;
  order: string;
  search_name?: string;
  rule?: string;
  filter_status?: string;
};
const getIntentPoolList = async (data: GetIntentPoolListType) => {
  return await apiService.axiosGet(API.getIntentPoolList, data, { timeout: 3000000, isHideMessage: true });
};

/**
 * 新建意图池
 */
type AddIntentPoolType = {
  intentpool_name: string;
  description: Text;
  doc_name: string;
  doc_content?: Text;
  intent_entity_list: JSON;
};
const addIntentPool = async (data: AddIntentPoolType) => {
  return await apiService.axiosPost(API.addIntentPool, data, { isHideMessage: true });
};

/**
 * 编辑意图池
 */
type EditIntentPoolType = {
  intentpool_id: number;
};
const editIntentPool = async (data: EditIntentPoolType) => {
  return await apiService.axiosGet(API.editIntentPool, data, { isHideMessage: true });
};

/**
 * 更新意图池
 */
type UpdateIntentPoolType = {
  intentpool_id: number;
  is_upload: boolean;
  intentpool_name?: string;
  description?: Text;
  doc_name?: string;
  doc_content?: Text;
  intent_entity_list?: JSON;
};
const updateIntentPool = async (data: UpdateIntentPoolType) => {
  return await apiService.axiosPost(API.updateIntentPool, data, { isHideMessage: true });
};

/**
 * 删除意图池
 */
type DeleteIntentPoolType = {
  intentpool_id: number;
};
const deleteIntentPool = async (data: DeleteIntentPoolType) => {
  return await apiService.axiosPost(`${API.deleteIntentPool}`, data);
};

/**
 * 上传文件
 */
const uploadFile = async (data: any) => {
  return await apiService.axiosPost(API.uploadFile, { type: 'file', ...data });
};

/**
 * 导出报告
 */
type ExportResultType = {
  intentpool_id: number;
};
const exportResult = async (data: ExportResultType, record: any) => {
  const result = await request({
    method: 'get',
    url: API.exportResult,
    params: data,
    config: {
      responseType: 'blob'
    }
  });

  const zipType = 'application/zip;charset-UTF-8';
  const blob = new Blob([result.data], { type: zipType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${record?.intentpool_name}${intl.get('intention.exportTwo')}.zip`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * 加载模型接口
 */
type LoadModelType = {
  intentpool_id: number;
};
const loadModel = async (data: LoadModelType) => {
  return await apiService.axiosGet(API.loadModel, data, { timeout: 3000000, isHideMessage: true });
};

/**
 * 下载模型
 */
type DownLoadType = {
  intentpool_id: number;
};
const downLoadModel = async (data: DownLoadType, record: any) => {
  const result = await request({
    method: 'get',
    url: API.downLoadModel,
    params: data,
    config: {
      responseType: 'blob'
    }
  });
  const ymlType = 'application/x-tar;charset-UTF-8';
  const blob = new Blob([result.data], { type: ymlType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${record?.intentpool_name}${intl.get('intention.modelTwo')}.tar.gz`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * 下载模板
 */
const downTemplate = async () => {
  const result = await request({
    method: 'get',
    url: API.downTemplate,
    params: {},
    config: {
      responseType: 'blob'
    }
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(result.data);
  link.download = `${intl.get('intention.schema')}.zip`;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * 训练模型
 */
type TrainModelType = {
  intentpool_id: number;
};
const trainModel = async (data: TrainModelType) => {
  return await apiService.axiosPost(API.trainModel, data, { isHideMessage: true });
};

/**
 * 测试模型
 */
type TestIntentModelType = {
  intentpool_id: number;
  query_text: string;
};
const testIntentModel = async (data: TestIntentModelType) => {
  return await apiService.axiosGet(API.testIntentModel, data, { isHideMessage: true });
};

export default {
  getIntentPoolList,
  addIntentPool,
  editIntentPool,
  deleteIntentPool,
  updateIntentPool,
  uploadFile,
  exportResult,
  downLoadModel,
  trainModel,
  testIntentModel,
  downTemplate,
  loadModel
};
