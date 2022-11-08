/**
 * @description 搜索结果页请求
 * @author Eden
 * @date 2021/01/27
 */

import apiService from '@/utils/axios-http';
import { API } from '../api';
import Axios from 'axios';

const source = Axios.CancelToken.source();
/**
 *@description 获取分析报告
 */
const analysisReportGet = async data => {
  return await apiService.axiosGetData(API.analysisReportGet, data);
  // return await apiService.axiosGet(`${API.analysisReportGet}/?id=${data.id}&rid=${data.rid}`);
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

/**
 * 探索两点之间的路径
 */
const explorePath = async data => {
  return await apiService.axiosPost(API.explorePath, data, { timeout: 30000 });
};

/**
 * 探索两点之间的路径的详细信息
 */
const explorePathDetails = async data => {
  return await apiService.axiosPost(API.explorePathDetails, data);
};
export default {
  analysisReportGet,
  exploreRelation,
  expandEdges,
  explorePath,
  explorePathDetails
};
