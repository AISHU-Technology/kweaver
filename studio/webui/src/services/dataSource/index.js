/**
 * 数据源管理请求
 * @Author liang.zhiqiang@eisoo.com
 * @Version 1.0
 * @Date 2020/8/10
 */
import apiService from '@/utils/axios-http';
import { API } from '@/services/api';

/**
 * 测试链接
 * @param {Object} data 请求`data`
 */
const sourceConnectTest = async data => await apiService.axiosPost(API.sourceConnectTest, data);

/**
 * 添加数据源
 * @param {Object} data 请求`data`
 */
const dataSourcePost = async data => await apiService.axiosPost(API.dataSourcePost, data);

/**
 * 复制数据源
 */
const postCopyDs = async ({ ds_id, ...data }) => await apiService.axiosPost(`${API.postCopyDs}${ds_id}`, data);

/**
 * 获取数据源
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 */
const dataSourceGet = async (page, size, order, knw_id) =>
  await apiService.axiosGetData(API.dataSourceGet, { page, size, order, knw_id });

/**
 * 在图谱流程中获取数据源
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 */
const dataSourceGetByGraph = async (id, page, size, order) =>
  await apiService.axiosGetData(`${API.dataSourceGetByGraph}${id}`, { page, size, order });

/**
 * 修改数据源
 * @param {Object} data 请求`data`
 */
const dataSourcePut = async (data, id) => await apiService.axiosPut(`${API.dataSourcePut}${id}`, data);

/**
 * 删除数据源
 * @param {string} dsname 请求`数据源名`
 */
const dataSourceDelete = async dsids => await apiService.axiosDelete(API.dataSourceDelete, { data: { dsids } });

/**
 * 模糊查询数据源
 * @param {string} dsname 请求`数据源名`
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 */
const getDsByName = async (dsname, page, size, order, knw_id) =>
  await apiService.axiosGetData(API.getDsByName, { dsname, page, size, order, knw_id });

/**
 * 发起as授权
 * @param {int} route 回调路由
 * @param {int} ip 需要授权的ip
 * @param {int} ip 授权的key
 */
const asAuthGet = async (ip, port, key) =>
  await apiService.axiosGetData(API.asAuthGet, {
    ds_route: 'auth-success',
    ds_address: ip,
    ds_port: port,
    ds_auth: key
  });

/**
 * 将授权信息保存到后端
 */
const asAuthPost = async body => await apiService.axiosPost(API.asAuthPost, body);

/**
 * 删除本体
 * @param {string} dsname 请求`数据源名`
 */
const deleteOnto = async otlids => await apiService.axiosDelete(API.deleteOnto, { data: { otlids } });

/**
 * 模糊查询本体
 * @param {string} otlname 本体名称
 * @param {int} page 请求`页码`
 * @param {int} size 请求`每页条数`
 */
const getOntoByName = async (otlname, otl_status, page, size, order) =>
  await apiService.axiosGetData(API.getOntoByName, { otlname, otl_status, page, size, order });

export default {
  sourceConnectTest,
  dataSourcePost,
  postCopyDs,
  dataSourceGet,
  dataSourceGetByGraph,
  dataSourcePut,
  dataSourceDelete,
  getDsByName,
  asAuthGet,
  asAuthPost,
  deleteOnto,
  getOntoByName
};
