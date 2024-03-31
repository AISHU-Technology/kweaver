import _ from 'lodash';
import { GRAPH_LAYOUT } from '@/enums';
import { formatToEditor } from '@/components/ParamCodeEditor';
import { getShowLabels } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/utils';

type SearchResult = {
  vertices_parsed_list: Record<string, any>[];
  edges_parsed_list: Record<string, any>[];
  paths_parsed_list: { nodes: any[]; relationships: any[] }[];
}[];

/**
 * 构造图数据
 * @param res 后端返回的搜索结果数据
 */
export const constructGraph = (res: SearchResult) => {
  const nodes: any[] = [];
  const edges: any[] = [];

  _.forEach(res, item => {
    // 点
    _.forEach(item.vertices_parsed_list, vertex => {
      const n = createNode(vertex);
      nodes.push(n);
    });

    // 边
    _.forEach(item.edges_parsed_list, edge => {
      const e = createEdge(edge);
      edges.push(e);
    });

    // 路径
    _.forEach(item.paths_parsed_list, path => {
      _.forEach(path.nodes, vertex => {
        const n = createNode(vertex);
        nodes.push(n);
      });

      _.forEach(path.relationships, edge => {
        const e = createEdge(edge);
        edges.push(e);
      });
    });
  });

  return { nodes, edges };
};

const createNode = (vertex: any) => {
  const { vid, tags, properties = {}, alias } = vertex;
  if (!tags) return { uid: vid, id: vid };
  const classId = tags[0];
  const proMap = _.keyBy(properties, 'tag');
  const showLabels = getShowLabels(
    { '#id': vid, '#alias': alias, '#entity_class': classId },
    proMap[classId]?.props || properties
  );

  return {
    ..._.pick(vertex, 'color', 'icon', 'default_property'),
    uid: vid,
    id: vid,
    alias,
    class: classId,
    showLabels
  };
};

const createEdge = (edge: any) => {
  const { src_id, dst_id, edge_class, edge_id, properties, color, alias } = edge;
  const id = edge_id?.replace(/"/g, '');
  const showLabels = getShowLabels({ '#id': id, '#alias': alias, '#edge_class': edge_class }, properties, true);
  return {
    uid: edge_id,
    id: edge_id,
    color,
    alias,
    class: edge_class,
    showLabels,
    source: src_id,
    target: dst_id,
    relation: [src_id, id, dst_id]
  };
};

/**
 * 生成保存的画布数据
 * @param canvas 画布实例
 */
export const generateCanvasData = (canvas: any) => {
  if (!canvas.graph) return { canvas_body: '', canvas_config: JSON.stringify({ key: GRAPH_LAYOUT.FREE }) };
  const { graphData, graph, layoutConfig } = canvas;
  const nodesKV = _.keyBy(graphData?.nodes, 'id');
  const edgesKV = _.keyBy(graphData?.edges, 'id');

  _.forEach(graph.current?.getNodes(), d => {
    const { x, y, id, isAgencyNode, _sourceData } = d.getModel();
    if (id === 'groupTreeNodeTemp') return;
    if (isAgencyNode) return;
    if (nodesKV[id]) {
      if (layoutConfig?.key === GRAPH_LAYOUT.TREE) {
        nodesKV[id] = { ...nodesKV[id], ..._sourceData };
      } else {
        nodesKV[id] = { ...nodesKV[id], ..._sourceData, x, y };
      }
    } else {
      nodesKV[id] = { x, y, ..._sourceData };
    }
  });

  if (!layoutConfig?.default?.isGroup) {
    _.forEach(graph.current?.getEdges(), d => {
      const { id, _sourceData } = d.getModel();
      if (!id) return;
      if (!_sourceData) return;
      if (edgesKV[id]) {
        edgesKV[id] = { ...edgesKV[id], ..._sourceData };
      } else {
        edgesKV[id] = _sourceData;
      }
    });
  }

  const nodes = _.values(nodesKV);
  const edges = _.values(edgesKV);

  const canvas_body = JSON.stringify({
    layoutConfig,
    nodes: _.map(nodes, item => {
      const { x, y, uid, size, alias, color, showLabels, icon, default_property } = item;
      const result = {
        x,
        y,
        uid,
        size,
        alias,
        color,
        showLabels,
        class: item?.class,
        id: uid,
        icon,
        default_property
      };
      return result;
    }),
    edges: _.map(edges, item => {
      const { uid, lineWidth, alias, color, relation, showLabels } = item;
      const result = { uid, lineWidth, alias, color, relation, showLabels, class: item?.class, id: uid };
      return result;
    })
  });
  const canvas_config = layoutConfig?.key ? _.pick(layoutConfig, 'key', 'default') : { key: GRAPH_LAYOUT.FREE };
  return { canvas_body, canvas_config: JSON.stringify(canvas_config) };
};

/*
 * 应用配置时更新参数的坐标和输入值类型
 */
export const updatePosition = (oldData: any[], newData: any[]) => {
  const map = _.keyBy(newData, '_id');
  return _.map(oldData, item => {
    if (map[item._id]) {
      item.position = map[item._id].position;

      if (item.param_type === 'entity') {
        item.input = item.options === 'multiple' ? [] : undefined;
      }

      if (item.param_type === 'string') {
        item.input = _.isString(item.input) ? item.input : undefined;
      }
    }
    return item;
  });
};

/**
 * 去除参数中多余的字段
 * @param params
 */
export const getCorrectParams = (params: any[]) => {
  return _.map(params, item => {
    const data = _.pick(item, 'name', 'alias', 'description', 'position', 'param_type', 'options');
    data.position.sort((a: any, b: any) => (b.example === item.example ? -1 : 0));
    return data;
  });
};

/**
 * 将输入的搜索值填充到语句
 * @param statement 函数语句
 * @param params 函数参数
 */
export const formatStatements = (statement: string, params: any[]) => {
  const [statements] = formatToEditor(statement, params, p => {
    const { input } = p;
    if (_.isArray(input)) {
      return _.map(input, i => `'${i}'`).join(',');
    }
    return input;
  });
  return [statements.join('\n')];
};
