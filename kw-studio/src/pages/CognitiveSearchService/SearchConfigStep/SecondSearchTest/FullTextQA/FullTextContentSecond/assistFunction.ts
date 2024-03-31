import _ from 'lodash';
import G6 from '@antv/g6';
import { getCorrectColor } from '@/utils/handleFunction';

const onItemData = (name: string, key: any) => {
  return {
    key,
    label: name,
    children: [{ key: `${key}_key`, label: `图谱${key}` }]
  };
};

export const itemData = _.map([0, 1, 2, 3, 4], (item: any) => {
  return onItemData(`知识图谱${item}`, item);
});

export const checkboxData = () => {
  const allSelect = _.map([0, 1, 2, 3, 4], (item: any) => {
    return { id: item, name: '啦啦啦', color: 'blue' };
  });
  return allSelect;
};

/**
 * 长字符截断显示
 * @param str 字符
 * @param num 截断个数
 */
const cutName = (str = '', num = 5) => {
  return str.length <= num ? str : `${str.slice(0, num)}...`;
};

/**
 * 处理后端返回的图谱数据
 * @param data 后端图谱数据
 */
export const convertData = (data: any, kgId?: any) => {
  // const { edge: e, entity } = data;
  const e = data?.edge;
  const entity = data?.entity;
  const mapping = new Map();

  // 处理点
  const nodeHandle = entity?.reduce((pre: any, key: any) => {
    const { name, alias, colour, icon } = key;
    const color = getCorrectColor(colour);
    const node = {
      name,
      alias,
      color,
      icon,
      kg_id: kgId,
      id: name,
      loopEdge: [], // 自闭环的边(自定义字段, 方便查询)
      relationEdges: [], // 相邻的边(自定义字段, 方便查询)
      label: cutName(alias, 15),
      style: { fill: color }
    };
    pre[name] = node;
    mapping.set(name, node);
    return pre;
  }, {});

  // 处理边
  const edges = e?.reduce((pre: any, key: any) => {
    const { alias, colour, name, relations } = key;
    const color = getCorrectColor(colour);
    const id = relations.join('-');
    const [source, , target] = relations;
    const isLoop = source === target; // 是否闭环
    const edge = {
      name,
      alias,
      id,
      label: cutName(alias, 15),
      color,
      source,
      target,
      type: isLoop ? 'loop' : undefined,
      loopCfg: isLoop ? { position: 'top', dist: 100 } : undefined,
      style: {
        lineAppendWidth: 14,
        endArrow: {
          fill: color,
          path: isLoop ? G6.Arrow.triangle(10, 12, 0) : G6.Arrow.triangle(10, 12, 12)
        }
      }
    };
    pre.push(edge);
    mapping.set(id, edge);

    // 给点类添加标记
    !nodeHandle[source]?.relationEdges?.includes(name) && nodeHandle[source]?.relationEdges?.push(name);
    if (isLoop) {
      nodeHandle[target] && nodeHandle[target].loopEdge.push(name);
    } else {
      !nodeHandle[target]?.relationEdges?.includes(name) && nodeHandle[target]?.relationEdges?.push(name);
    }
    return pre;
  }, []);

  // 处理平行边 (两个端点相同则称两条边相互平行，不处理可能会导致重叠)
  G6.Util.processParallelEdges(edges as any);
  const nodes = Object.values(nodeHandle);
  const graph = {
    nodes,
    edges,
    mapping,
    nodeLen: nodeHandle.length,
    edgeLen: [...new Set(edges.map((e: any) => e.name))]?.length
  };
  return graph;
};
