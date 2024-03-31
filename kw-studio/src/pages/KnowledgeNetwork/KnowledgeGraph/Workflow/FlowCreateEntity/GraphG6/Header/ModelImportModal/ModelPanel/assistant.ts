import _ from 'lodash';
import { MODEL_ICON } from '@/utils/antv6';

const defaultField = {
  source_table: [],
  ds_name: '',
  file_type: '',
  source_type: 'automatic',
  extract_type: '',
  data_source: '',
  ds_path: '',
  dataType: '',
  ds_id: '',
  task_id: '',
  ds_address: ''
};

/**
 * 将模型导入画布, 添加默认字段, 并且携带坐标信息, 方便渲染
 * @param graph 预览的模型图谱
 */
export const createModelGraph = (graph: { nodes: any[]; edges: any[] }, model: string) => {
  const nodes = _.map(graph.nodes, n => {
    const x = n.x + window.innerWidth / 4;
    const y = n.y + window.innerHeight / 5;
    return {
      ...defaultField,
      ..._.pick(n, 'name', 'alias', 'colour', 'properties', 'properties_index'),
      x,
      y,
      model,
      icon: MODEL_ICON,
      default_tag: n.properties[0][0]
    };
  });
  const edges = _.map(graph.edges, e => {
    return {
      ...defaultField,
      ..._.pick(e, 'name', 'alias', 'color', 'properties', 'properties_index', 'relations'),
      colour: e.color,
      model
    };
  });
  return { nodes, edges };
};
