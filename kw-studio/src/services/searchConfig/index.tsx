/**
 * @description 高级搜索策略配置
 */
import apiService from '@/utils/axios-http/oldIndex';
import { API } from '@/services/api';

const fetchConfigGraph = async (data: { knowledge_network_id: number; kg_name?: string }) =>
  await apiService.axiosPost(API.fetchConfigGraph, data);

const addAdvConfig = async (data: {
  kg_id: number;
  conf_name: string;
  conf_content: Record<string, any>;
  type?: string;
  conf_desc?: string;
}) => await apiService.axiosPost(API.addAdvConfig, data);

const updateAdvConfig = async (data: {
  conf_id: number;
  conf_name: string;
  conf_content: Record<string, any>;
  conf_desc?: string;
}) => await apiService.axiosPost(API.updateAdvConfig, data);

const deleteAdvConfig = async (data: { conf_ids: any[] }) =>
  await apiService.axiosDelete(API.deleteAdvConfig, { data });

const fetchConfig = async (id: number) => await apiService.axiosGet(`${API.fetchConfig}/${id}`);

const fetchConfigList = async (data: {
  knowledge_network_id: number;
  query?: string;
  page: number;
  size: number;
  filter: 'all' | 'config' | 'kg' | string;
  sort: 'descend' | 'ascend' | string;
}) => {
  return await apiService.axiosGetData(API.fetchConfigList, data);
};

/**
 * 根据图谱id获取画布数据
 * WARNING 接口由builder提供, 但是会diff比对图数据库, 仅返回图数据库中存在的数据, 返回的数据可能和本体不一致, 供engine使用
 * @param id 图谱id
 */
const fetchCanvasData = async (id: number | string) => await apiService.axiosGet(`${API.fetchCanvasData}/${id}`);

const advSearchV2 = async (data: { ids: string; query?: string; page: number; size: number }) => {
  const { ids, ...other } = data;
  return await apiService.axiosGetData(`${API.advSearchV2}/${ids}`, other);
};

const advSearchTestV2 = async (data: {
  kg_ids: number | string;
  query?: string;
  page: number;
  size: number;
  conf_content: Record<string, any>;
}) => {
  return await apiService.axiosPost(API.advSearchTestV2, data);
};

const entityPropertiesGet = async (data: { id: number; class: string }) => {
  return await apiService.axiosPost(API.entityPropertiesGet, data);
};

const servicesSearchConfig = {
  fetchConfigGraph,
  addAdvConfig,
  updateAdvConfig,
  deleteAdvConfig,
  fetchConfig,
  fetchConfigList,
  fetchCanvasData,
  advSearchV2,
  advSearchTestV2,
  entityPropertiesGet
};

export default servicesSearchConfig;
