import apiService from '@/utils/axios-http/engineServer';
import openApiService from '@/utils/axios-http/openApiRequest';
import { request } from '@/utils/axios-http/trialRequest';
import apiOldService from '@/utils/axios-http/oldIndex';

import { API } from '@/services/api';
import { OPEN_API } from '@/services/openApi';

// 是否是iframe页面
const isIframe = () => window.location.pathname.includes('iframe');

/**
 * 新建搜索配置
 */
const createSearch = async (body: any) =>
  await apiService.axiosPost(`${API.createSearch}`, body, { isHideMessage: true });

/**
 * 编辑
 */
const editSearch = async (body: any) => {
  return await apiService.axiosPost(API.editSearch(body.id), body, { isHideMessage: true });
};

/**
 * 获取指定图分析服务
 */
const getAppointList = async (body: string, type?: string) => {
  if (type === 'ad') return await apiService.axiosGet(`${API.getAppointList}/${body}`);
  if (isIframe()) {
    return await openApiService.axiosGet(`${OPEN_API.openGetAppointList}/${body}`);
  }
  return await apiService.axiosGet(`${API.getAppointList}/${body}`);
};

/**
 * 图分析服务列表
 * @param body
 */
const cognitiveSearchList = async (body: any) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openCognitiveSearchList, body);
  }
  return await apiService.axiosGet(API.cognitiveSearchList, body);
};

/**
 * 取消发布
 */
const cancelPublish = async (body: any) => await apiService.axiosPost(API.cancelPublish(body.service_id), body);

/**
 * 删除指定服务
 */
const deleteSearch = async (body: any) => await apiService.axiosPost(API.deleteSearch(body.service_id), body);

/**
 * 初始化
 */
const getInitialization = async (body: any) => {
  if (isIframe()) {
    return await openApiService.axiosPost(`${OPEN_API.openGetInitialization}`, body);
  }
  return await apiService.axiosPost(`${API.getInitialization}`, body);
};

/**
 * 获取初始化状态
 */
const getStatus = async (body: any) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openGetStatus(body), {}, { isHideMessage: true });
  }
  return await apiService.axiosGet(API.getStatus(body), {}, { isHideMessage: true });
};

/**
 * 流程二测试
 */
const searchTest = async (body: any) => {
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openSearchTest(body.service_id), body);
  }
  return await apiService.axiosPost(API.searchTest(body.service_id), body, { isHideMessage: true });
};

/**
 * 表格测试进入
 */
const searchTactics = async (body: any) => {
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openSearchTest(body.service_id), body);
  }
  return await apiService.axiosPost(API.searchTactics(body.service_id), body, { isHideMessage: true });
};

const getPropertyRequest = async (body: any) => await apiService.axiosGet(`${API.kgqaProperty}`, body);

/**
 * 获取有效的图谱
 */
const getKgList = async (body: any) => await apiService.axiosGet(API.getKgList(body));

/**
 * openAi 测试连接
 */
const openAiTest = async (body: any) =>
  await apiService.axiosPost(API.openAiTest, body, { timeout: 3000000, isHideMessage: true });

/**
 *
 * @param data {ip,port}
 * @returns
 */
const checkLink = async (data: any) => {
  return await apiService.axiosGet(API.checkLink, data);
};

/**
 * 下载大模型模板
 */
const exportModelTemplate = async () => {
  const result = await request({
    method: 'get',
    url: API.exportModelTemplate,
    params: {},
    config: {
      responseType: 'blob'
    }
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(result.data);
  link.download = '模板.zip';
  link.click();
  URL.revokeObjectURL(link.href);
};

/** 解析大模型 */
const parseModel = async (data: any) => {
  return await apiOldService.axiosPost(API.parseModel, { type: 'file', ...data });
};

/** prompt 测试 */
const testPrompt = async (data: any) => {
  return await apiService.axiosPost(API.promptTest, data);
};

const cognitiveSearchService = {
  cognitiveSearchList,
  getInitialization,
  getStatus,
  searchTest,
  searchTactics,
  createSearch,
  editSearch,
  cancelPublish,
  getAppointList,
  deleteSearch,
  getPropertyRequest,
  getKgList,
  openAiTest,
  checkLink,
  exportModelTemplate,
  testPrompt,
  parseModel
};

export default cognitiveSearchService;
