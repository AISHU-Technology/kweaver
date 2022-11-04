import { getCorrectColor } from '@/utils/handleFunction';
import G6 from '@antv/g6';
import type { TGraphData, TConfigData } from './types';

export const CN_NUMBER = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
export const EN_NUMBER = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/**
 * 长字符截断显示
 * @param str 字符
 * @param num 截断个数
 */
const cutName = (str = '', num = 5) => {
  return str.length <= num ? str : `${str.slice(0, num)}...`;
};

/**
 * 处理后端后端返回的图谱数据
 * @param origin 后端图谱数据
 * @returns graph 用于G6渲染的图谱数据
 */
const convertData = (origin: Record<string, any>): TGraphData => {
  const { entity: v = [], edge: e = [] } = origin;
  const mapping = new Map();

  // 处理点
  const nodeObj = v.reduce((res: any, item: any) => {
    const { name, alias, colour } = item;
    const color = getCorrectColor(colour);
    const node = {
      name,
      alias,
      color,
      id: name,
      loopEdge: [], // 自闭环的边(自定义字段, 方便查询)
      relationEdges: [], // 相邻的边(自定义字段, 方便查询)
      label: cutName(alias, 15),
      style: { fill: color }
    };

    res[name] = node;
    mapping.set(name, node);

    return res;
  }, {});

  // 处理边
  const edges = e.reduce((res: any, item: any) => {
    const { name, alias, colour, relations } = item;
    const color = getCorrectColor(colour);
    const id = relations.join('-');
    const [source, , target] = relations;
    const isLoop = source === target; // 是否是 自闭环
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
          path: isLoop ? G6.Arrow.triangle(10, 12, 0) : G6.Arrow.triangle(10, 12, 25),
          d: isLoop ? 0 : 25
        }
      }
    };
    res.push(edge);
    mapping.set(id, edge);

    // 给点类添加标记
    !nodeObj[source]?.relationEdges?.includes(name) && nodeObj[source]?.relationEdges?.push(name);
    if (isLoop) {
      nodeObj[target] && nodeObj[target].loopEdge.push(name);
    } else {
      !nodeObj[target]?.relationEdges?.includes(name) && nodeObj[target]?.relationEdges?.push(name);
    }

    return res;
  }, []);

  G6.Util.processParallelEdges(edges);

  const nodes = Object.values(nodeObj);
  const graph = {
    nodes,
    edges,
    mapping,
    nodeLen: nodes.length,
    edgeLen: [...new Set(edges.map((e: any) => e.name))].length
  };

  return graph;
};

/**
 * 初始化配置规则
 * @param graph 图数据
 */
const initConfig = (graph: TGraphData, conf_content?: Record<string, any>) => {
  const { nodes = [], edges = [] } = graph;
  const nodeList = nodes.map(node => node.id);
  const edgeList = [...new Set([...edges.map(edge => edge.name)])];

  if (conf_content) {
    const { search_range, display_range } = conf_content;
    const nodeScope = search_range?.vertexes?.open || []; // 后端不讲武德可能返回null
    const nodeRes = display_range?.vertexes?.open || [];
    const edgeScope = search_range?.edges?.open || [];
    const a = {
      nodeScope: nodeScope.filter((id: string) => nodeList.includes(id)),
      nodeRes: nodeRes.filter((id: string) => nodeList.includes(id)),
      edgeScope: edgeScope.filter((name: string) => edgeList.includes(name))
    };
    return a;
  }

  return { nodeScope: nodeList, nodeRes: [...nodeList], edgeScope: edgeList };
};

/**
 * 生成后端需要的配置数据
 * @param selectedData 前端选择的数据
 * @param max_depth 关系深度
 */
const generateConfig = (selectedData: TConfigData, max_depth: number) => {
  const { nodeScope, nodeRes, edgeScope } = selectedData;

  return {
    max_depth,
    search_range: {
      vertexes: { open: nodeScope },
      edges: { open: edgeScope }
    },
    display_range: {
      vertexes: { open: nodeRes }
    }
  };
};

/**
 * 处理属性 object --> [{}, ...]
 * @param pro 搜索结果命中的实体属性
 */
const handleProperties = (pro: Record<string, any>) => {
  return Object.entries(pro).map(([key, value]) => ({ n: key, v: value }));
};

export { cutName, convertData, initConfig, generateConfig, handleProperties };
