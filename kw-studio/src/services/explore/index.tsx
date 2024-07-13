/**
 * 探索分析
 */
import apiService from '@/utils/axios-http/engineServer';
import { API } from '@/services/api';
import { baseCanvasFindPath, findNeighborsByCanvas } from './assistant';

/**
 *@description 获取分析报告
 */
const analysisReportGet = async (data: any) => {
  return await apiService.axiosGet(API.analysisReportGet, data);
};

/**
 * 探索分析展开实体点
 */
const expandEdges = async (data: any) => {
  return await apiService.axiosPost(API.expandEdges, data, { timeout: 600000 });
};

/**
 * 邻居查询
 */
const getNeighbors = async (
  data: {
    id: string;
    vids: string[];
    steps: number;
    final_step: boolean;
    direction: string;
    filters?: any;
    size?: number;
    page?: number;
  },
  searchScope?: string,
  graphData?: any
) => {
  if (searchScope === 'canvas') {
    const result = findNeighborsByCanvas(graphData?.graph?.current, data);
    return {
      res: {
        nodes: result?.nodes,
        edges: result?.edges,
        nodes_count: result?.nodes?.length,
        edges_count: result?.edges?.length
      }
    };
  }
  return await apiService.axiosPost(API.getNeighbors(data.id), data, { timeout: 600000 });
};

/**
 * 探索两点之间的路径
 */
const explorePath = async (
  data: {
    kg_id: string | number;
    source: string;
    target: string;
    direction: string;
    path_type: number;
    path_decision?: string;
    edges?: string;
    property?: string;
    steps?: number;
    limit?: number;
    filters?: any;
    default_value?: string;
  },
  searchScope?: string,
  graphData?: any
) => {
  if (searchScope === 'canvas') {
    const result = baseCanvasFindPath(graphData, data);

    return { res: result };
  }
  return await apiService.axiosPost(API.explorePath(data.kg_id), data, { timeout: 600000 });
};

/**
 * 探索两点之间的路径的详细信息
 */
const explorePathDetails = async (data: any) => {
  return await apiService.axiosPost(API.explorePathDetails, data, { timeout: 600000 });
};

/**
 * 查询点的进出边数量接口
 */
const getInOrOut = async (data: any) => {
  return await apiService.axiosGet(API.exploreSearchE(data?.kg_id), { vid: data?.vid });
};

/**
 * 快速查找, 搜索联想
 */
const quickSearch = async (data: any) => {
  const { kg_id, ...body } = data;
  return await apiService.axiosGet(`${API.quickSearch}/${kg_id}/quick-search`, body);
};

export default {
  analysisReportGet,
  expandEdges,
  explorePath,
  explorePathDetails,
  getInOrOut,
  getNeighbors,
  quickSearch
};
