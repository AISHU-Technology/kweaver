/**
 * @description 创建本体页请求
 * @author Eden
 * @date 2020/08/10
 */

import apiService from '@/utils/axios-http';
import { API } from '@/services/api';

/**
 * @description 获取数据源
 */
const getSource = async () => await apiService.axiosGet(API.getSource);

/**
 * @description 获取数据表
 * @param {object} data 获取数据表点参数
 */
const getDataList = async data => await apiService.axiosGetData(API.getDataList, data);

/**
 * @description 获取其他数据源的预览数据
 * @param {object} data
 */
const getOtherPreData = async data => await apiService.axiosGetData(API.getOtherPreData, { ...data, ds_id: data.id });

/**
 * @description 获取子文件
 * @param {object} data
 */
const getChildrenFile = async data => await apiService.axiosGetData(API.getChildrenFile, data);

/**
 * @description 预测本体生成知识网络数据
 * @param {object} data
 */
const getFileGraphData = async data => await apiService.axiosPost(API.getFileGraphData, data);

/**
 * @description 获取所有本体
 */
const getAllNoumenon = async () =>
  await apiService.axiosGetData(API.getAllNoumenon, { page: -1, size: 10, order: 'descend' });

/**
 * @description 按本体名获取内容
 */
const getAllNoumenonData = async name => await apiService.axiosGetData(API.getAllNoumenonData, { name });

/**
 * @description 新增本体
 */
const addEntity = async data => await apiService.axiosPost(API.addEntity, data);

/**
 * @description 获取模型
 */
const fetchModelList = async () => await apiService.axiosGet(API.fetchModelList);

/**
 * 根据名字获取本体信息
 */
const getEntityInfo = async id => await apiService.axiosGet(`${API.getEntityInfo}${id}`);

/**
 * @description 复制本体
 */
const copyGetEntityInfo = async (id, data) => await apiService.axiosPost(`${API.copyGetEntityInfo}${id}`, data);

/**
 * @description 流程3中按id获取数据源
 */
const getFlowSource = async data => await apiService.axiosGetData(API.getFlowSource, data);

/**
 * @description 流程修改知识网络
 */
const changeFlowData = async (id, data) => await apiService.axiosPost(`${API.changeFlowData}${id}`, data);

/**
 * @description 获取模型预览数据
 */
const getModelPreview = async model => await apiService.axiosGetData(API.getModelPreview, { model });

/**
 * @description 非结构化预测本体
 */
const unstructuredData = async data => await apiService.axiosPost(API.unstructuredData, data);

/**
 * @description 添加结构化预测任务
 */
const buildTask = async data => await apiService.axiosPost(API.buildTask, data);

/**
 * @description 获取预测任务列表
 */
const getEntityTasks = async data => await apiService.axiosPost(API.getEntityTasks, data);

/**
 * @description 删除任务
 */
const deleteEntityTask = async data => await apiService.axiosPost(API.deleteEntityTask, data);

/**
 * @description 获取预测文件状态
 */
const getTaskFiles = async data => await apiService.axiosGetData(API.getTaskFiles, data);

/**
 * @description 删除新增任务
 */
const delAllEntityTask = async data => await apiService.axiosDelete(`${API.delAllEntityTask}?ontology_id=${data}`);

/**
 * @description 修改本体名称信息
 */
const changeEntityTent = async (data, id) => await apiService.axiosPut(`${API.changeEntityTent}${id}`, data);

/**
 * @description 保存本体信息
 */
const updateEntity = async (data, id) => await apiService.axiosPut(`${API.updateEntity}${id}`, data);

export default {
  getDataList,
  getOtherPreData,
  getChildrenFile,
  getFileGraphData,
  getAllNoumenon,
  addEntity,
  fetchModelList,
  getEntityInfo,
  getFlowSource,
  changeFlowData,
  getAllNoumenonData,
  getModelPreview,
  unstructuredData,
  buildTask,
  getEntityTasks,
  deleteEntityTask,
  getTaskFiles,
  copyGetEntityInfo,
  delAllEntityTask,
  changeEntityTent,
  updateEntity,
  getSource
};
