import _ from 'lodash';
import { isDef } from '@/utils/handleFunction';
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
 * @param graph 预览的模型图谱x
 */
export const createModelGraph = (graph: { nodes: any[]; edges: any[] }, model: string, canvas?: any) => {
  // 弹窗的画布宽高
  const WIDTH = 714;
  const HEIGHT = 357;
  const nodeMap = _.reduce(
    canvas?.getNodes?.(),
    (res, item) => {
      const node = item?.get?.('model');
      const xy = _.pick(node, 'x', 'y');
      const x = xy.x + (window.innerWidth - WIDTH) * 0.5;
      const y = xy.y + (window.innerHeight - HEIGHT) * 0.33;
      return { ...res, [node?._sourceData?.name]: { x, y } };
    },
    {} as any
  );
  const nodes = _.map(graph.nodes, n => {
    return {
      ...defaultField,
      ...n,
      ...(nodeMap[n.name] || {}),
      model
    };
  });
  const edges = _.map(graph.edges, e => {
    return {
      ...defaultField,
      ...e,
      model
    };
  });

  return { nodes, edges };
};
