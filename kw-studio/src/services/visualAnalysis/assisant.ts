import _ from 'lodash';
import { fuzzyMatch } from '@/utils/handleFunction';

// 基于画布全文检索
export const fullTextByCanvas = (params: any, graph: any) => {
  const { matching_rule, query, search_config, matching_num } = params;
  let nodes = graph.getNodes();
  nodes = _.filter(nodes, item => {
    if (!item.get('visible')) return false;

    // 筛选关键字
    const showLabels = item?._cfg?.model?._sourceData?.showLabels;
    const values = _.map(showLabels, label => label?.value);

    let isSatisfy = false;
    if (matching_rule === 'portion') {
      // 模糊匹配
      isSatisfy = _.some(values, e => {
        return fuzzyMatch(_.toLower(query), _.toLower(e));
      });
    }
    if (matching_rule === 'completeness') {
      // 全匹配
      isSatisfy = _.isEmpty(query) ? true : _.some(values, e => _.toLower(e) === _.toLower(query));
    }
    return isSatisfy;
  });

  // 筛选属性
  if (!_.isEmpty(search_config)) {
    nodes = getFilterDataOld(nodes, search_config);
  }

  nodes = _.slice(nodes, 0, matching_num); // 筛选数量

  // 构造数据
  const result = getModelData(nodes);

  return { nodes: result, edges: [] };
};

// 基于画布vid搜索
export const vidSearchByCanvas = (params: any, graph: any) => {
  const { vids, search_config } = params;
  let nodes = graph.getNodes();
  nodes = _.filter(nodes, item => {
    if (!item.get('visible')) return false;
    // 筛选 id
    if (vids.length === 0 || (vids.length === 1 && vids[0] === '')) return true;
    const showLabels = item?._cfg?.model?._sourceData?.showLabels;
    const id = _.filter(showLabels, label => label?.key === 'id')?.[0]?.value;
    return _.includes(vids, item._cfg.id) || _.includes(vids, id);
  });
  if (!_.isEmpty(search_config)) {
    const allNodes = getFilterDataOld(nodes, search_config);
    return allNodes;
  }
  const result = getModelData(nodes);
  return { nodes: result, edges: [] };
};

// 根据规则筛选数据 旧规则
const getFilterDataOld = (nodes: any, search_config: any) => {
  const result = _.filter(nodes, node => {
    const item = node.getModel()?._sourceData;
    const searchTag = _.find(search_config, c => c?.tag === item?.class);
    const searchP = searchTag?.properties;
    if (searchTag && !searchP) return true;
    if (!searchP) return false;
    const showLabelsKV = _.keyBy(item.showLabels, 'key');
    let mateNumber = 0;
    _.forEach(searchP, d => {
      const nodeP = showLabelsKV[d.name];
      if (nodeP) {
        if (d.operation === 'lt' && parseInt(d.op_value) > parseInt(nodeP?.value)) mateNumber++;
        if (d.operation === 'gt' && parseInt(d.op_value) < parseInt(nodeP?.value)) mateNumber++;
        if (d.operation === 'eq' && d.op_value === nodeP?.value) mateNumber++;
      }
    });
    if (mateNumber === searchP?.length) return true;
    return false;
  });
  return result;
};

// 构造弹窗数据
const getModelData = (nodes: any) => {
  const result = _.map(nodes, node => {
    const item = node.getModel()._sourceData;
    const { id, color, showLabels, alias, icon, default_property } = item;
    const props = getProperties(showLabels);
    const properties = [{ props, tag: item?.class }];
    return { id, color, tags: [item?.class], properties, alias, icon, default_property };
  });

  return result;
};

const getProperties = (list: any) => {
  const pro: any = [];
  const def = ['#id', '#entity_class', '#edge_class', '#alias'];
  _.forEach(list, item => {
    const { alias, key, value, type } = item;
    if (!_.includes(def, key)) {
      pro.push({ name: key, alias, value, type, checked: false, disabled: false });
    }
  });
  return pro;
};
