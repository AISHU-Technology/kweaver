import apiService from '@/utils/axios-http';
import { API } from '../api';

/**
 *@description 获取分析报告
 */
const analysisReportGet = async data => {
  return await apiService.axiosGetData(API.analysisReportGet, data);
};

/**
 * @description 探索关系
 */
const exploreRelation = async data => {
  return await apiService.axiosPost(API.exploreRelation, data);
};

/**
 * 探索分析展开实体点
 */
const expandEdges = async data => {
  return await apiService.axiosGetData(API.expandEdges, data);
};

export default {
  analysisReportGet,
  exploreRelation,
  expandEdges
};
