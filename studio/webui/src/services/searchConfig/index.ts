/**
 * @description 高级搜索策略配置
 * @author Jason.ji
 * @date 2021/3/25
 * @update 2022/6/17
 */
import apiService from '@/utils/axios-http';
import { API } from '@/services/api';
import { OPEN_API } from '@/services/openApi';

// 获取可配置的图谱
const fetchConfigGraph = async (data: {
  knowledge_network_id: number; // 知识网络id
  kg_name?: string; // 搜索图谱名
}) => await apiService.axiosPost(API.fetchConfigGraph, data);

// 新增/保存认知搜索配置
const addAdvConfig = async (data: {
  kg_id: number; // 图谱id
  conf_name: string; // 配置名
  conf_content: Record<string, any>; // 配置内容
  type?: string; // 图谱模型
  conf_desc?: string; // 配置描述
}) => await apiService.axiosPost(API.addAdvConfig, data);

// 更新认知搜索配置
const updateAdvConfig = async (data: {
  conf_id: number; // 配置id
  conf_name: string; // 配置名
  conf_content: Record<string, any>; // 配置内容
  conf_desc?: string; // 配置描述
}) => await apiService.axiosPost(API.updateAdvConfig, data);

// 删除认知搜索配置
const deleteAdvConfig = async (data: {
  conf_ids: any[]; // 配置id数组
}) => await apiService.axiosDelete(API.deleteAdvConfig, { data });

// 获取单一配置
const fetchConfig = async (id: number) => await apiService.axiosGet(`${API.fetchConfig}/${id}`);

// 获取配置列表
const fetchConfigList = async (data: {
  knowledge_network_id: number; // 知识网络id
  query?: string; // 搜索关键字
  page: number; // 页码
  size: number; // 分页数
  filter: 'all' | 'config' | 'kg' | string; // 过滤类型：全部 | 配置名 | 图谱名
  sort: 'descend' | 'ascend' | string; // 按时间排序
}) => {
  return await apiService.axiosGetData(API.fetchConfigList, data);
};

// 检查配置信息
const checkConfig = async (data: {
  kg_id: number; // 图谱id
  conf_name: string; // 配置名
  conf_id?: number; // 配置id, 传参时为编辑, 反之新增
  type?: string; // 图谱模型
  conf_desc?: string; // 配置描述
}) => await apiService.axiosPost(API.checkConfig, data);

/**
 * 根据图谱id获取画布数据
 * WARNING 接口由builder提供, 但是会diff比对图数据库, 仅返回图数据库中存在的数据, 返回的数据可能和本体不一致, 供engine使用
 * @param id 图谱id
 */
const fetchCanvasData = async (id: number) => await apiService.axiosGet(`${API.fetchCanvasData}/${id}`);

// 认知搜索
const advSearchV2 = async (data: {
  ids: string; // 多个配置id, 英文逗号分隔
  query?: string; // 搜索关键字
  page: number; // 分页
  size: number; // 分页数
}) => {
  const { ids, ...other } = data;
  return await apiService.axiosGetData(`${API.advSearchV2}/${ids}`, other);
};

// 认知搜索-测试配置
const advSearchTestV2 = async (data: {
  kg_ids: number | string; // 图谱id
  query?: string; // 搜索关键字
  page: number; // 分页
  size: number; // 分页数
  conf_content: Record<string, any>; // 配置内容
}) => {
  return await apiService.axiosPost(API.advSearchTestV2, data);
};

// 获取实体类中的所有属性
const entityPropertiesGet = async (data: {
  id: number; // 图谱id
  class: string; // 实体类名
}) => await apiService.axiosPost(API.entityPropertiesGet, data);

const servicesSearchConfig = {
  fetchConfigGraph,
  addAdvConfig,
  updateAdvConfig,
  deleteAdvConfig,
  fetchConfig,
  fetchConfigList,
  checkConfig,
  fetchCanvasData,
  advSearchV2,
  advSearchTestV2,
  entityPropertiesGet
};

export default servicesSearchConfig;
