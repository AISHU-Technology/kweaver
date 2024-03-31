/**
 * @description 创建本体页请求
 * @author Eden
 * @date 2020/08/10
 */

import apiService from '@/utils/axios-http/oldIndex';
import buildService from '@/utils/axios-http/buildAxios';
import { API } from '@/services/api';
import { request } from '@/utils/axios-http/trialRequest';

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
 * @description 提交预测抽取规则任务
 * @param {object} data
 */
const submitExtractTask = async data => await apiService.axiosPost(API.submitExtractTask, data);

/**
 * @description 获取所有本体
 */
const getAllNoumenon = async data => await apiService.axiosGetData(API.getAllNoumenon, data);

/**
 * @description 新增本体
 */
const addEntity = async data => await apiService.axiosPost(API.addEntity, data);

/**
 * @description 删除本体
 */
const delEntity = async data => await apiService.axiosPost(API.delEntity, data);

/**
 * @description 编辑本体
 */
const editEntity = async (otl_id, data) => await apiService.axiosPost(API.editEntity(otl_id), data);

/**
 * @description 编辑本体信息
 */
const updateName = async (otl_id, data) => await apiService.axiosPost(API.updateName(otl_id), data);

/**
 * @description 下载本体样例
 */
const downloadEntityTemplateJson = async data => await apiService.axiosPost(API.downloadEntityTemplate, data);
const downloadEntityTemplateXlsx = async data =>
  await request({
    method: 'post',
    url: API.downloadEntityTemplate,
    params: data,
    config: {
      responseType: 'blob'
    }
  });

/**
 * @description 导出本体文件
 */
const exportEntityJson = async data => await apiService.axiosPost(API.exportEntity, data);
const exportEntityXlsx = async data =>
  await request({
    method: 'post',
    url: API.exportEntity,
    params: data,
    config: {
      responseType: 'blob'
    }
  });

/**
 * @description 导入本体文件
 */
const importEntity = async data => {
  return await apiService.axiosPost(
    API.importEntity,
    { type: 'file', ...data },
    { headers: { 'knw-id': data?.knw }, timeout: 300000 }
  );
};

/**
 * @description 导入本体文件状态
 */
const getEntityImportStatus = async data => await apiService.axiosGetData(API.getEntityImportStatus, data);

/**
 * @description 获取模型
 */
const fetchModelList = async () => await apiService.axiosGet(API.fetchModelList);

/**
 * 根据名字获取本体信息
 */
const getEntityInfo = async otl_id => await apiService.axiosGet(API.getEntityInfo(otl_id));

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

/**
 * 获取流程四预测任务信息
 * @param {number} graph_id 图谱id
 */
const getExtractTask = async graph_id => await apiService.axiosGetData(API.getExtractTask, { graph_id });

/**
 * 获取分区表
 */
const getHivePartition = async data => await apiService.axiosGetData(API.getHivePartition, data);

/**
 * 预览分区表达式
 */
const previewPartition = async data =>
  await apiService.axiosGetData(API.previewPartition, data, { isHideMessage: true });

/**
 * 检查分区配置
 */
const checkPartition = async data => await apiService.axiosPost(API.checkPartition, data);

// --------------------------- sql 抽取相关接口 开始 ------------------------
/** sql 抽取 预览数据 */
const sqlExtractPreview = data => buildService.axiosPost(API.getSqlExtractPreview, data);

/** sql 抽取 */
const sqlExtract = data => buildService.axiosPost(API.sqlExtract, data);
// --------------------------- sql 抽取相关接口 结束 ------------------------

/** 获取向量服务状态 */
const getVectorServiceStatus = () => buildService.axiosGet(API.getVectorServiceStatus, {});

export default {
  getSource,
  getDataList,
  getOtherPreData,
  getChildrenFile,
  submitExtractTask,
  getAllNoumenon,
  addEntity,
  fetchModelList,
  getEntityInfo,
  getFlowSource,
  changeFlowData,
  getModelPreview,
  unstructuredData,
  buildTask,
  getEntityTasks,
  deleteEntityTask,
  getTaskFiles,
  delAllEntityTask,
  changeEntityTent,
  updateEntity,
  getExtractTask,
  delEntity,
  editEntity,
  downloadEntityTemplateJson,
  downloadEntityTemplateXlsx,
  exportEntityJson,
  exportEntityXlsx,
  importEntity,
  updateName,
  getEntityImportStatus,
  getHivePartition,
  previewPartition,
  checkPartition,
  sqlExtractPreview,
  sqlExtract,
  getVectorServiceStatus
};
