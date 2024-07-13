import apiService from '@/utils/axios-http/studioAxios';
import buildAxios from '@/utils/axios-http/buildAxios';
import { API } from '../api';

/**
 * 获取提示词项目列表
 */
export const promptProjectList = async (body: any) => await apiService.axiosGet(API.promptProjectList, body);

/**
 * 新增提示词项目
 */
export const promptProjectAdd = async (body: { prompt_item_name: string }) =>
  await apiService.axiosPost(API.promptProjectAdd, body);

/**
 * 编辑提示词项目
 */
export const promptProjectEdit = async (body: any) => await apiService.axiosPost(API.promptProjectEdit, body);

/**
 * 删除提示词项目
 */
export const promptProjectRemove = async (body: any) => await apiService.axiosPost(API.promptProjectRemove, body);

/**
 * 新增提示词分类
 */
export const promptCategoryAdd = async (body: any) => await apiService.axiosPost(API.promptCategoryAdd, body);

/**
 * 编辑提示词分类
 */
export const promptCategoryEdit = async (body: any) => await apiService.axiosPost(API.promptCategoryEdit, body);

/**
 * 提示词管理-编辑
 */
export const managePromptEdit = async (body: any) =>
  await apiService.axiosPost(API.managePromptEdit, body, { isHideMessage: true });

/**
 * 删除提示词分类
 */
export const promptCategoryRemove = async (body: any) => await apiService.axiosPost(API.promptCategoryRemove, body);

/**
 * 获取提示词列表
 */
export const promptList = async (body: any) => await apiService.axiosGet(API.promptList, body);

/**
 * 新增提示词
 */
export const promptAdd = async (body: any) => await apiService.axiosPost(API.promptAdd, body, { isHideMessage: true });

/**
 * 获取提示词详情
 */
export const promptDetail = async (body: { prompt_id: string }) =>
  await apiService.axiosGet(API.promptDetail(body.prompt_id));

/**
 * 编辑提示词名称
 */
export const promptNameEdit = async (body: any) => await apiService.axiosPost(API.promptNameEdit, body);

/**
 * 编辑提示词配置
 */
export const promptEdit = async (body: any) => await apiService.axiosPost(API.promptEdit, body);

/**
 * 获取大语言模型列表
 */
export const promptLLMList = async (body?: any) => await apiService.axiosGet(API.promptLLMList, body);

/**
 * 获取提示词模板
 */
export const promptTemplateGet = async (body?: { prompt_name?: string; prompt_type?: string }) =>
  await apiService.axiosGet(API.promptTemplateGet, body);

/**
 * 发布提示词
 */
export const promptDeploy = async (body: any) => await apiService.axiosPost(API.promptDeploy, body);

/**
 * 取消发布提示词
 */
export const promptUndeploy = async (body: any) => await apiService.axiosPost(API.promptUndeploy, body);

/**
 * 运行提示词
 */
export const promptRun = async (body: any) => {
  return await apiService.axiosPost(API.promptRun, body);
};

/**
 * 运行提示词(流式)
 */
export const promptRunStream = async (body: any) =>
  await buildAxios.axiosGet(API.promptRunStream, body, { responseType: 'stream', timeout: 1000000 });

/**
 * 获取提示词代码模板
 */
export const promptCodeGet = async (body: any) => await apiService.axiosGet(API.promptCodeGet, body);

export const promptApiDoc = async (body: any) => await apiService.axiosGet(API.promptApiDoc, body);

/**
 * 生成雪花id
 */
export const promptSnowId = async () => await apiService.axiosGet(API.promptSnowId);

/**
 * 删除项目、分组、提示词
 */
export const promptDelete = async (body: { item_id?: string; type_id?: string; prompt_id?: string }) =>
  await apiService.axiosPost(API.promptDelete, body);

/**
 * 移动分组
 */
export const promptMove = async (body: { prompt_item_id: string; prompt_item_type_id: string; prompt_id: string }) =>
  await apiService.axiosPost(API.promptMove, body);
