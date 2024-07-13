import apiService from '@/utils/axios-http/oldIndex';
import { API } from '@/services/api';

/**
 * 查询子图列表
 * @param data.graph_id 知识图谱id
 * @param data.subgraph_name 子图的名称，模糊查询 默认空
 * @param data.return_all 是否返回全部
 */
const subgraphGetList = async (data: { graph_id: number; subgraph_name: string; return_all?: 'True' | 'False' }) =>
  await apiService.axiosGetData(API.subgraphGetList, data);

/**
 * 获取子图配置详情
 * @param subgraph_id 子图id
 */
const subgraphInfoDetail = async ({ subgraph_id }: { subgraph_id: number }) =>
  await apiService.axiosGet(`${API.subgraphInfoDetail}/${subgraph_id}`);

/**
 * 执行图谱分批构建任务
 * @param graph_id 图谱id
 * @param data.subgraph_ids 子图配置id列表
 * @param data.return_all 写入模式
 */
const subgraphRunTask = async (
  graph_id: number,
  data: {
    graph_id: number;
    subgraph_ids: Array<number>;
    write_mode: string;
    flag: string;
  }
) => await apiService.axiosPost(`${API.subgraphRunTask}/${graph_id}`, data);

/**
 * 获取历史任务子图详情
 * @param task_id 历史任务id
 */
const subgraphHistoryDetail = async ({ task_id }: { task_id: number }) =>
  await apiService.axiosGet(`${API.subgraphHistoryDetail}/${task_id}`);

/**
 * 新增子图(分组)
 * @param graph_id 图谱id
 * @param name 子图名称
 * @param ontology_id 本体id
 * @param entity 实体类
 * @param edge 关系类
 */
const subgraphAdd = async (data: { graph_id: number; name: string; ontology_id: number; entity: any[]; edge: any[] }) =>
  await apiService.axiosPost(API.subgraphAdd, data);

type SubgraphBody = {
  subgraph_id: number;
  name: string;
  entity?: any[];
  edge?: any[];
}[];
/**
 * 编辑子图(分组)
 * @param id 图谱id
 * @param data.subgraph_id 图谱id
 * @param data.name 子图名称
 * @param data.entity 实体类
 * @param data.edge 关系类
 */
const subgraphEdit = async (id: number, data: SubgraphBody) =>
  await apiService.axiosPost(`${API.subgraphEdit}/${id}`, data);

/**
 * 删除子图(分组)
 * @param graph_id 图谱id
 * @param subgraph_ids 子图id数组
 */
const subgraphDelete = async (data: { graph_id: number; subgraph_ids: number[] }) =>
  await apiService.axiosPost(API.subgraphDelete, data);

/**
 * 保存子图(分组), 但不校验数据是否正确
 * @param id 图谱id
 * @param data.subgraph_id 图谱id
 * @param data.name 子图名称
 * @param data.entity 实体类
 * @param data.edge 关系类
 */
const subgraphSave = async (id: number, data: SubgraphBody) =>
  await apiService.axiosPost(`${API.subgraphSave}/${id}`, data);

const servicesSubGraph = {
  subgraphGetList,
  subgraphInfoDetail,
  subgraphRunTask,
  subgraphHistoryDetail,
  subgraphAdd,
  subgraphEdit,
  subgraphDelete,
  subgraphSave
};

export default servicesSubGraph;
