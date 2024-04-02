/**
 * 工作流
 * @Author liang.zhiqiang@eisoo.com
 * @Version 1.0
 * @Date 2020/9/10
 */
import { API } from '@/services/api';
import apiService from '@/utils/axios-http/oldIndex';

/**
 * 发送登录信息
 * @param {Object} data 请求`data`
 */
const graphCreate = async data => await apiService.axiosPost(API.graphCreate, data);

const graphEdit = async (id, data) => await apiService.axiosPost(`${API.graphEdit}/${id}`, data);

const graphGet = async id => await apiService.axiosGet(`${API.graphGet}/${id}`);

const graphSaveNoCheck = async data => await apiService.axiosPost(API.graphSaveNoCheck, data);

/**
 * 单独获取流程四数据
 * @param id 图谱id
 */
const graphGetExtract = async id => await apiService.axiosGetData(API.graphGetExtract, { graph_id: id });

/**
 * 第五步获取实体集合及属性集合
 */
const graphGetInfoExt = async id => await apiService.axiosGet(`${API.graphGetInfoExt}=${id}`);

/**
 * @description 检验流程五中数据
 */
const graphCheckKmApInfo = async data => await apiService.axiosPost(API.graphCheckKmApInfo, data);

/**
 * @description 流程六执行任务
 */
const performTask = async (id, data) => await apiService.axiosPost(`${API.performTask}/${id}`, data);

export default {
  graphCreate,
  graphEdit,
  graphGet,
  graphSaveNoCheck,
  graphGetExtract,
  graphGetInfoExt,
  graphCheckKmApInfo,
  performTask
};