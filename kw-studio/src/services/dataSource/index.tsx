import apiService from '@/utils/axios-http/oldIndex';
import { API } from '@/services/api';

/**
 * 测试链接
 * @param {Object} data 请求`data`
 */
const sourceConnectTest = async (data: any) => await apiService.axiosPost(API.sourceConnectTest, data);

/**
 * 添加数据源
 * @param {Object} data 请求`data`
 */
const dataSourcePost = async (data: any) => await apiService.axiosPost(API.dataSourcePost, data);

/**
 * 复制数据源
 */
const postCopyDs = async (param: any) => {
  return await apiService.axiosPost(`${API.postCopyDs}/${param.ds_id}`, param.data);
};

/**
 * 获取数据源
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 */
const dataSourceGet = async (page: number, size: number, order: string, knw_id: number, ds_type = '') => {
  const params: any = { page, size, order, knw_id };
  ds_type !== '' ? (params.ds_type = ds_type) : null;
  return await apiService.axiosGetData(API.dataSourceGet, params);
};

/**
 * 获取数据源
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 */
const dataSourceGetNew = async (page: number, size: number, order: string, knw_id: string, filter: string) =>
  await apiService.axiosGetData(API.dataSourceGet, { page, size, order, knw_id, filter });

/**
 * 在图谱流程中获取数据源
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 */
const dataSourceGetByGraph = async (id: number, page: number, size: number, order: string) =>
  await apiService.axiosGetData(`${API.dataSourceGetByGraph}${id}`, { page, size, order });

/**
 * 修改数据源
 * @param {Object} data 请求`data`
 */
const dataSourcePut = async (data: any, id: string) => await apiService.axiosPost(`${API.dataSourcePut}${id}`, data);

/**
 * 删除数据源
 * @param {string} dsname 请求`数据源名`
 */
const dataSourceDelete = async (dsids: any) => await apiService.axiosDelete(API.dataSourceDelete, { data: { dsids } });

/**
 * 模糊查询数据源
 * @param {string} dsname 请求`数据源名`
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 */
const getDsByName = async (dsname: string, page: number, size: number, order: string, knw_id: string) =>
  await apiService.axiosGetData(API.getDsByName, { dsname, page, size, order, knw_id });

/**
 * 发起as授权
 * @param {string} route 回调路由
 * @param {string} ip 需要授权的ip
 * @param {string} ip 授权的key
 */
const asAuthGet = async (ip: string, port: string, key: string) =>
  await apiService.axiosGetData(API.asAuthGet, {
    ds_route: 'auth-success',
    ds_address: ip,
    ds_port: port,
    ds_auth: key
  });

/**
 * 将授权信息保存到后端
 */
const asAuthPost = async (body: any) => await apiService.axiosPost(API.asAuthPost, body);

/**
 * @description 获取数据表
 * @param {object} data 获取数据表点参数
 */
const getSheetData = async (data: any) => await apiService.axiosGetData(API.getDataList, data);

/**
 *
 * @param {*} data {ds_id, data_source, name, model_name}
 * @returns
 */
const previewdata = async (data: any) => await apiService.axiosGetData(API.previewdata, data);

/**
 * 领域数据sql查询
 */
const dataSourceSql = async (data: any) => await apiService.axiosPost(API.dataSourceSql, data);

/**
 * 获取表字段属性
 */
const getTableField = async (data: any) => apiService.axiosGetData(API.getTableField, data);

export default {
  sourceConnectTest,
  dataSourcePost,
  postCopyDs,
  dataSourceGet,
  dataSourceGetNew,
  dataSourceGetByGraph,
  dataSourcePut,
  dataSourceDelete,
  getDsByName,
  asAuthGet,
  asAuthPost,
  getSheetData,
  previewdata,
  dataSourceSql,
  getTableField
};
