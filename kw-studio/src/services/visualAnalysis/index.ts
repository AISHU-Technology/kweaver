import apiService from '@/utils/axios-http/engineServer';
import openApiService from '@/utils/axios-http/openApiRequest';

import { API } from '@/services/api';
import { OPEN_API } from '@/services/openApi';
import { fullTextByCanvas, vidSearchByCanvas } from './assisant';
// 是否是iframe页面
const isIframe = () => window.location.pathname.includes('iframe');
/**
 * 查询分析列
 */
const visualAnalysisList = async (
  knw_id: number | string,
  data: {
    kg_id?: number | string;
    query?: any;
    page?: number;
    size?: number;
    order_type?: string;
    order_field?: string;
  }
) => await apiService.axiosGet(`${API.visualAnalysisList}/${knw_id}`, data);

/**
 * 获取指定画布的信息
 * @param id
 * @returns
 */
const visualGetCanvasInfoById = async (id: string | number) => {
  return await apiService.axiosGet(`${API.visualGetCanvasInfoById}/${id}`);
};

/**
 * 获取有画布的图谱列表
 * @param id
 * @returns
 */
const visualGraphList = async (id: number) => await apiService.axiosGet(`${API.visualGraphList}/${id}/kgs`);
/**
 * 新增画布
 * @param data
 * @returns
 */
const visualAnalysisAdd = async (data: {
  kg_id: number | string;
  knw_id: number | string;
  canvas_name: string;
  canvas_info?: string;
  canvas_body: any;
}) => {
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openVisualAnalysisAdd, data, { isHideMessage: true });
  }
  return await apiService.axiosPost(API.visualAnalysisAdd, data, { isHideMessage: true });
};

/**
 * 删除画布
 * @param c_id 画布id
 * @returns
 */
const visualAnalysisDelete = async (data: { c_ids: number[] }) =>
  await apiService.axiosPost(`${API.visualAnalysisDelete}`, data);

/**
 * 更新画布
 * @param data
 * @returns
 */
const visualAnalysisUpdate = async (data: {
  c_id: number;
  canvas_name?: string;
  canvas_info?: string;
  canvas_body?: string;
}) => {
  if (isIframe()) {
    return await openApiService.axiosPost(`${OPEN_API.openVisualAnalysisUpdate}/${data?.c_id}/update`, data, {
      isHideMessage: true
    });
  }
  return await apiService.axiosPost(`${API.visualAnalysisUpdate}/${data?.c_id}/update`, data, { isHideMessage: true });
};

/**
 * 全文检索
 * @param data
 * @returns
 */
const fullTestRetrieval = async (
  data: {
    kg_id: number | string;
    query: string;
    matching_rule: 'completeness' | 'portion';
    matching_num: number;
    search_config?: Array<any>;
    size: number;
    page: number;
  },
  searchScope?: string,
  graphData?: any
) => {
  if (searchScope === 'canvas') {
    const result = fullTextByCanvas(data, graphData?.graph?.current);
    return { res: result };
  }
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openFullTestRetrieval(data.kg_id), data, {
      timeout: 600000
    });
  }
  return await apiService.axiosPost(API.fullTestRetrieval(data.kg_id), data, { timeout: 600000 });
};

/**
 * vid查询点
 * @param data
 * @returns
 */
const vidRetrieval = async (
  data: {
    kg_id: number | string;
    vids: Array<string>;
    search_config?: Array<any>;
    size: number;
    page: number;
  },
  searchScope?: string,
  graphData?: any
) => {
  if (searchScope === 'canvas') {
    const result = vidSearchByCanvas(data, graphData?.graph?.current);
    return { res: result };
  }
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openVidRetrieval(data.kg_id), data, {
      timeout: 600000
    });
  }
  return await apiService.axiosPost(API.vidRetrieval(data.kg_id), data, { timeout: 600000 });
};

/**
 * eid查询边
 * @param data
 */
const eidRetrieval = async (data: { kg_id: number | string; eids: Array<string> }) => {
  if (isIframe()) {
    return await openApiService.axiosPost(OPEN_API.openEidRetrieval(data.kg_id), data, {
      timeout: 600000
    });
  }
  return await apiService.axiosPost(API.eidRetrieval(data.kg_id), data, { timeout: 600000 });
};

/**
 * 函数查询
 */
const customSearch = async (data: { kg_id: number | string; statements: any }) => {
  if (isIframe()) {
    (data as any).search_type = 'internal';
    return await openApiService.axiosPost(OPEN_API.openCustomSearch(data.kg_id), data, { timeout: 600000 });
  }
  return await apiService.axiosPost(API.customSearch(data.kg_id), data, { timeout: 600000 });
};

export default {
  visualAnalysisList,
  visualGetCanvasInfoById,
  visualGraphList,
  visualAnalysisAdd,
  visualAnalysisDelete,
  visualAnalysisUpdate,
  fullTestRetrieval,
  vidRetrieval,
  eidRetrieval,
  customSearch
};
