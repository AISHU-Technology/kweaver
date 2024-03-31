/**
 * 探索分析
 */
import apiService from '@/utils/axios-http/engineServer';
import { API } from '@/services/api';
import { OPEN_API } from '@/services/openApi';
import openApiService from '@/utils/axios-http/openApiRequest';
import { baseCanvasFindPath, findNeighborsByCanvas } from './assistant';

// 是否是iframe页面
const isIframe = () => window.location.pathname.includes('iframe');

/**
 *@description 获取分析报告
 */
const analysisReportGet = async (data: any) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openAnalysisReportGet, data);
  }
  return await apiService.axiosGet(API.analysisReportGet, data);
};

/**
 * 探索分析展开实体点
 */
const expandEdges = async (data: any) => {
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openExpandEdges, data);
  }
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
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openNeighbors(data.id), data, { timeout: 600000 });
  }
  return await apiService.axiosPost(API.getNeighbors(data.id), data, { timeout: 600000 });
};

/**
 * 探索两点之间的路径
 */
const explorePath = async (
  data: {
    kg_id: string | number; // 图谱id
    source: string; // 起点
    target: string; // 终点
    direction: string; // 方向
    path_type: number; // 路径类型 0：全部 1：最短 2：无环
    path_decision?: string; // 最短路径决策依据
    edges?: string; // 边类
    property?: string; // 权重属性
    steps?: number; // 路径深度
    limit?: number; // 限制结果总数
    filters?: any; // 筛选规则
    default_value?: string;
  },
  searchScope?: string, // 搜索范围
  graphData?: any // 画布数据
) => {
  if (searchScope === 'canvas') {
    const result = baseCanvasFindPath(graphData, data);

    return { res: result };
  }
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openExplorePath(data.kg_id), data);
  }
  return await apiService.axiosPost(API.explorePath(data.kg_id), data, { timeout: 600000 });
};

/**
 * 探索两点之间的路径的详细信息
 */
const explorePathDetails = async (data: any) => {
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openExplorePathDetails, data);
  }
  return await apiService.axiosPost(API.explorePathDetails, data, { timeout: 600000 });
};

/**
 * 查询点的进出边数量接口
 */
const getInOrOut = async (data: any) => {
  if (isIframe()) {
    return await openApiService.axiosGet(OPEN_API.openExploreSearchE(data?.kg_id), {
      vid: data?.vid
    });
  }
  // return await apiService.axiosGet(`${API.exploreSearchE}/${data?.kg_id}/searche?vid=${data?.vid}`);
  return await apiService.axiosGet(API.exploreSearchE(data?.kg_id), { vid: data?.vid });
};

/**
 * 快速查找, 搜索联想
 */
const quickSearch = async (data: any) => {
  const { kg_id, ...body } = data;
  if (isIframe()) {
    return await openApiService.axiosGet(`${OPEN_API.openQuickSearch}/${kg_id}/quick-search`, body);
  }
  // 自定义序列化参数函数
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
