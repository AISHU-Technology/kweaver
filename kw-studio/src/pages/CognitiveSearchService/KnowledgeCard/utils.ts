import _ from 'lodash';
import servicesPermission from '@/services/rbacPermission';
import { NodeConfigItem } from './types';

/**
 * 获取真实排序的组件, 不在sort中的组件会被放到末尾
 * @param _components 组件列表
 * @param sort 排序的id数组
 */
export const getSortedComponents = (_components: any[], sort: string[]) => {
  const weightMap = _.reduce(sort, (res, id, index) => ({ ...res, [id]: index + 1 }), {} as Record<string, number>);
  const components = [..._components];
  components.sort((a, b) => {
    const aw = weightMap[a.id] || 99;
    const bw = weightMap[b.id] || 99;
    return aw === bw ? 0 : aw > bw ? 1 : -1;
  });
  return components;
};

/**
 * 判断配置是否变化
 * @param config 单个实体配置
 */
export const isConfigChanged = (config: NodeConfigItem) => {
  if (!config.node?.name) return false;
  const oldSort = _.map(config.componentsCache, c => c.id);
  if (!_.isEqual(oldSort, config.sort)) return true;
  const components = getSortedComponents(config.components, config.sort).map(c => _.omit(c, 'error'));
  const componentsCache = _.map(config.componentsCache, c => _.omit(c, 'error'));
  if (!_.isEqual(components, componentsCache)) return true;
  return false;
};

/**
 * 查询有权限的图谱id, 返回有权限的string类型id
 * @param ids 图谱id数组
 */
export const getPermissionIds = async (ids: string[]) => {
  const dataIds = _.map(ids, id => String(id));
  let authIds: string[] = [];
  try {
    // await servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   authIds = _.filter(dataIds, id => {
    //     return _.includes(codesData?.[id]?.codes, 'KG_VIEW');
    //   });
    // });
  } catch {
    //
  }
  return authIds;
};
