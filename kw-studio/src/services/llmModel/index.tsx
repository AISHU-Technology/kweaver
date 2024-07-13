import apiService from '@/utils/axios-http/studioAxios';
import { API } from '../api';

/**
 * 获取大模型列表
 */
export const llmModelList = async (body: {
  page: number;
  size: number;
  order: 'desc' | 'asc' | string;
  name: string;
  rule: string;
  series: string;
}) => await apiService.axiosGet(API.llmModelList, body);

/**
 * 获取大模型表单配置
 */
export const llmModelConfig = async () => await apiService.axiosGet(API.llmModelConfig);

/**
 * 获取单个模型的详细信息
 */
export const llmModelGet = async (body: { model_id: string }) => await apiService.axiosGet(API.llmModelGet, body);

/**
 * 测试模型连接状态
 */
export const llmModelTest = async (body: {
  model_id?: string;
  model_series?: string;
  model_config?: Record<string, any>;
}) => await apiService.axiosPost(API.llmModelTest, body);

type ModelBody = {
  model_series: string;
  model_type: 'chat' | 'completion' | string;
  model_name: string;
  model_describe: string;
  model_config: Record<string, any>;
};

/**
 * 新建模型配置
 */
export const llmModelAdd = async (body: ModelBody) => await apiService.axiosPost(API.llmModelAdd, body);

/**
 * 修改模型配置
 */
export const llmModelEdit = async (body: ModelBody) => await apiService.axiosPost(API.llmModelEdit, body);

/**
 * 删除模型配置
 */
export const llmModelRemove = async (body: { model_id: string }) =>
  await apiService.axiosPost(API.llmModelRemove, body);

/**
 * 模型部署
 */
export const llmModelDeploy = async (body: {
  model_name: string;
  model_deploy_name: string;
  model_deploy_desc: string;
}) => await apiService.axiosPost(API.llmModelDeploy, body);

/**
 * 模型文档
 */
export const llmApiDoc = async (body: { llm_id: string }) => await apiService.axiosGet(API.llmApiDoc, body);
