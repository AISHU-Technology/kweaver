import apiService from '@/utils/axios-http';
import { API } from '@/services/api';

/**
 * 计算知识图谱智商
 * @param data.graph_id 图谱id
 */
const intelligenceCalculate = async (data: { graph_id: number }) =>
  apiService.axiosPost(API.intelligenceCalculate, data);

/**
 * 知识网络下所有图谱智商详情列表查询
 * @param data.knw_id 知识网络id
 * @param data.graph_name 图谱的名称，模糊查询
 * @param data.page 页码, 1开始
 * @param data.size 每页大小，默认10
 * @param data.rule 需要排序的字段， 可逗号拼接
 * @param data.order 升序、降序
 */
const intelligenceGetByKnw = async (data: {
  knw_id: number;
  graph_name?: string;
  page?: number;
  size?: number;
  rule?: string;
  order?: string;
}) => apiService.axiosGetData(API.intelligenceGetByKnw, data);

/**
 * 知识图谱智商详情查询
 * @param data.graph_id 图谱id
 */
const intelligenceGetByGraph = async (data: { graph_id: number }) =>
  apiService.axiosGetData(API.intelligenceGetByGraph, data);

const servicesIntelligence = {
  intelligenceCalculate,
  intelligenceGetByKnw,
  intelligenceGetByGraph
};

export default servicesIntelligence;
