import apiService from '@/utils/axios-http';
import { API } from '@/services/api';

/**
 * 获取可配置的图谱
 * @param data.knowledge_network_id 知识网络id
 * @param data.kg_name 搜索图谱名
 */
const fetchConfigGraph = async (data: { knowledge_network_id: number; kg_name?: string }) =>
  await apiService.axiosPost(API.fetchConfigGraph, data);

/**
 * 新增/保存认知搜索配置
 * @param data.kg_id 图谱id
 * @param data.conf_name 配置名
 * @param data.conf_content 配置内容
 * @param data.type 图谱模型
 * @param data.conf_desc 配置描述
 */
const addAdvConfig = async (data: {
  kg_id: number;
  conf_name: string;
  conf_content: Record<string, any>;
  type?: string;
  conf_desc?: string;
}) => await apiService.axiosPost(API.addAdvConfig, data);

/**
 * 更新认知搜索配置
 * @param data.conf_id 配置id
 * @param data.conf_name 配置名
 * @param data.conf_content 配置内容
 * @param data.conf_desc 配置描述
 */
const updateAdvConfig = async (data: {
  conf_id: number;
  conf_name: string;
  conf_content: Record<string, any>;
  conf_desc?: string;
}) => await apiService.axiosPost(API.updateAdvConfig, data);

/**
 * 删除认知搜索配置
 * @param data.conf_ids 配置id数组
 */
const deleteAdvConfig = async (data: { conf_ids: any[] }) =>
  await apiService.axiosDelete(API.deleteAdvConfig, { data });

/**
 * 获取单一配置
 * @param id 图谱id
 */
const fetchConfig = async (id: number) => await apiService.axiosGet(`${API.fetchConfig}/${id}`);

/**
 * 获取已保存搜索策略列表
 * @param data.knowledge_network_id 知识网络id
 * @param data.query 搜索关键字
 * @param data.page 页码
 * @param data.size 分页数
 * @param data.filter 过滤类型：全部 | 配置名 | 图谱名
 * @param data.sort 按时间排序
 */
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
 * WARNING 接口由builder提供, 但是会diff比对图数据库, 仅返回图数据库中存在的数据,
 * 返回的数据可能和本体不一致, 供engine使用
 * @param id 图谱id
 */
const fetchCanvasData = async (id: number) => await apiService.axiosGet(`${API.fetchCanvasData}/${id}`);

/**
 * 认知搜索
 * @param data.ids 多个配置id, 英文逗号分隔
 * @param data.query 搜索关键字
 * @param data.page 分页
 * @param data.size 分页数
 */
const advSearchV2 = async (data: { ids: string; query?: string; page: number; size: number }) => {
  const { ids, ...other } = data;
  return await apiService.axiosGetData(`${API.advSearchV2}/${ids}`, other);
};

/**
 * 认知搜索-测试配置
 * @param data.kg_ids 图谱id
 * @param data.query 搜索关键字
 * @param data.page 分页
 * @param data.size 分页数
 * @param data.conf_content 配置内容
 */
const advSearchTestV2 = async (data: {
  kg_ids: number | string;
  query?: string;
  page: number;
  size: number;
  conf_content: Record<string, any>;
}) => {
  return await apiService.axiosPost(API.advSearchTestV2, data);
};

/**
 * 获取实体类中的所有属性
 * @param data.id 图谱id
 * @param data.class 实体类名
 */
const entityPropertiesGet = async (data: { id: number; class: string }) =>
  await apiService.axiosPost(API.entityPropertiesGet, data);

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
