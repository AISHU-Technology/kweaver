import _ from 'lodash';
import { localFindAllPath } from './utils';
import moment from 'moment';
export const baseCanvasFindPath = (
  dataSource: any,
  config: {
    kg_id: string | number;
    source: string;
    target: string;
    direction: string;
    path_type: number;
    path_decision?: string;
    edges?: string;
    property?: string;
    steps?: number;
    limit?: number;
    filters?: any;
    default_value?: string;
  }
) => {
  let startRid = config?.source;
  let endRid = config?.target;
  const getVisibleCallback = (res: any[], item: any) => {
    if (!item?.get('visible')) return res;
    res.push(item.getModel());
    return res;
  };
  const nodes = _.reduce(dataSource.graph.current.getNodes(), getVisibleCallback, []);
  const edges = _.reduce(dataSource.graph.current.getEdges(), getVisibleCallback, []);
  const data: any = { nodes, edges };

  const directed = config.direction !== 'bidirect';
  if (config.direction === 'reverse') {
    startRid = config?.source;
    endRid = config?.target;
  }

  const { allNodePath, allEdgePath } = localFindAllPath(data, startRid, endRid, directed);
  let allPath = [];
  for (let i = 0; i < allNodePath?.length; i++) {
    allPath.push({
      edges: allEdgePath[i],
      nodes: allNodePath[i]
    });
  }

  allPath = _.filter(allPath, path => path?.nodes?.length <= (config?.steps || 5) + 1);

  const result = getPathInfo(allPath, config, dataSource?.graph?.current);
  return result;
};

const getPathInfo = (pathList: { nodes: any[]; edges: any[] }[], filter: any, graph: any) => {
  const result: any[] = [];
  const pathIds: any[] = [];

  _.forEach(pathList, list => {
    const nodeids = filter?.direction === 'reverse' ? _.reverse(list?.nodes) : list?.nodes;
    const nodes = _.map(nodeids, item => graph?.findById(item)?.getModel()?._sourceData);
    const edges = _.map(list.edges, item => {
      const data = graph?.findById(item)?.getModel()?._sourceData;
      return { ...data, source: data?.relation?.[0], target: data?.relation?.[2] };
    });

    const filterEdge = _.filter(edges, e => {
      if (filter?.edges) return filter?.edges === e?.class;
      return true;
    });

    if (filterEdge.length === nodeids.length - 1) {
      const edgesId = _.map(filterEdge, item => item?.id);
      result.push({ nodes, edges: filterEdge });
      pathIds.push({ nodes: nodeids, edges: edgesId });
    }
  });

  if (!_.isEmpty(filter?.filters)) {
    let finalPaths: any[] = [];
    _.forEach(filter?.filters, item => {
      const { e_filters } = item;
      const finalPath = _.filter(result, item => {
        let isCompliant = true;
        _.forEach(e_filters, (filter, index) => {
          const edges = _.filter(item.edges, e => e?.class === filter?.edge_class);
          const notConfigE = _.filter(item?.edges, e => e.class !== filter?.edge_class);

          const satisfy = ['satisfy_all', 'satisfy_any'];
          let group = true;
          if (edges?.length === 0 && satisfy.includes(filter?.type) && filter.relation === 'and') {
            group = false;
          }
          if (notConfigE?.length > 0 && satisfy.includes(filter?.type) && Number(index) !== 0) {
            group = false;
          } else {
            _.forEach(edges, edge => {
              if (filter?.type === 'satisfy_all') {
                group = _.every(filter?.property_filters, p => {
                  const { value, type } = edge?.showLabels?.find((prop: any) => prop.key === p.name);
                  return getSatisfyValue(p, value, type);
                });

                if (filter?.property_filters?.length === 0) group = true;
              }
              if (filter?.type === 'satisfy_any') {
                group = _.some(filter?.property_filters, p => {
                  const { value, type } = edge?.showLabels?.find((prop: any) => prop.key === p.name);
                  return getSatisfyValue(p, value, type);
                });

                if (filter?.property_filters?.length === 0) group = true;
              }
              if (filter?.type === 'unsatisfy_all') {
                group = !_.every(filter?.property_filters, p => {
                  const { value, type } = edge?.showLabels?.find((prop: any) => prop.key === p.name);
                  return getSatisfyValue(p, value, type);
                });
                if (filter?.property_filters?.length === 0) group = false;
              }
              if (filter?.type === 'unsatisfy_any') {
                group = !_.some(filter?.property_filters, p => {
                  const { value, type } = edge?.showLabels?.find((prop: any) => prop.key === p.name);
                  return getSatisfyValue(p, value, type);
                });
                if (filter?.property_filters?.length === 0) group = false;
              }
            });
          }

          if (Number(index) === 0) isCompliant = group;

          if (Number(index) !== 0) {
            isCompliant = filter?.relation === 'and' ? isCompliant && group : isCompliant || group;
          }
        });

        return isCompliant;
      });
      finalPaths = _.concat(finalPaths, finalPath);
    });

    finalPaths = _.uniqWith(finalPaths, _.isEqual);

    return getPathAndDetail(finalPaths);
  }
  if (filter.path_type === 1) {
    if (filter?.property) {
      const sortData = _.sortBy(result, path => {
        let len = 0;

        _.forEach(path.edges, e => {
          const value = e?.showLabels?.find((prop: any) => prop?.key === filter?.property)?.value;

          const weight = value || filter?.default_value;
          len += Number(weight);
        });
        path.len = len;
        return len;
      });
      const shortestData: any = _.filter(sortData, item => item?.len === sortData?.[0]?.len);
      return getPathAndDetail(shortestData);
    }
    const minLength = _.minBy(result, path => path?.nodes?.length)?.nodes.length;
    const shortestData = _.filter(result, path => path?.nodes?.length === minLength);
    return getPathAndDetail(shortestData);
  }
  return getPathAndDetail(result);
};

const getSatisfyValue = (
  property_filter: { name: string; operation: string; op_value: any },
  pValue: any,
  type: string
) => {
  const { operation } = property_filter;
  let value = pValue;
  let op_value = property_filter?.op_value;

  if (type === 'date') {
    value = new Date(pValue);
    op_value = new Date(op_value);
    if (operation === 'eq') return value === op_value;
    if (operation === 'neq') return value !== op_value;
    if (operation === 'lt') return value < op_value;
    if (operation === 'gt') return value > op_value;
  }
  if (type === 'datetime') {
    const regex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}/;
    const dateTime = value.match(regex)[0];
    const formattedDateTime = dateTime?.replace('T', ' ').substring(0, 19);
    value = moment(formattedDateTime, 'YY-MM-DD HH:mm:ss');
    op_value = moment(op_value, 'YY-MM-DD HH:mm:ss');

    if (operation === 'neq') return value.isBefore(op_value) || value.isAfter(op_value);
    if (operation === 'eq') return !value.isBefore(op_value) && !value.isAfter(op_value);
    if (operation === 'lt') return value.isBefore(op_value);
    if (operation === 'gt') return value.isAfter(op_value);
  }

  if (operation === 'eq') return value === op_value;
  if (operation === 'neq') return value !== op_value;
  if (operation === 'lt') return Number(value) < Number(op_value);
  if (operation === 'lte') return Number(value) <= Number(op_value);
  if (operation === 'gt') return Number(value) > Number(op_value);
  if (operation === 'gte') return Number(value) >= Number(op_value);
  if (operation === 'contains') return _.includes(value, op_value);
  if (operation === 'not_contains') return !_.includes(value, op_value);
  if (operation === 'starts_with') return _.startsWith(value, op_value);
  if (operation === 'not_starts_with') return !_.startsWith(value, op_value);
  if (operation === 'ends_with') return _.endsWith(value, op_value);
  if (operation === 'not_ends_with') return !_.endsWith(value, op_value);
};

const getPathAndDetail = (sourceData: any) => {
  const nodesMap: Record<string, any> = {};
  const edgesMap: Record<string, any> = {};
  const paths: any[] = [];
  _.forEach(sourceData, path => {
    const nodeIds = _.map(path.nodes, d => {
      nodesMap[d.id] = d;
      return d.id;
    });
    const edgeIds = _.map(path.edges, d => {
      edgesMap[d.id] = d;
      return d.id;
    });
    paths.push({ nodes: nodeIds, edges: edgeIds });
  });
  return { nodes: _.values(nodesMap), edges: _.values(edgesMap), paths };
};

export const findNeighborsByCanvas = (
  graph: any,
  options: {
    id?: string;
    vids: string[];
    steps: number;
    final_step: boolean;
    direction: string;
    filters?: any;
    size?: number;
    page?: number;
  }
) => {
  const { vids: nodeIds, steps: depth, final_step: staticMode, direction, filters } = options;
  let resultNodes: any = [];
  let resultEdges: any = [];
  _.forEach(nodeIds, nodeId => {
    const nodeItem = graph.findById(nodeId);
    if (!nodeItem?.get('visible')) return;

    const nodeSet = new Set();
    const edgeSet = new Set();
    const queue = [nodeItem];

    let currentDepth = 1;
    while (queue.length > 0 && currentDepth <= depth) {
      const queueSize = queue.length;
      for (let i = 0; i < queueSize; i++) {
        const item = queue.shift();
        const edges = getEdgesByDirection(item, direction);
        // eslint-disable-next-line no-loop-func
        edges.forEach((edge: any) => {
          if (!edge?.get('visible')) return;
          const sourceNode = edge?.getSource();
          const targetNode = edge?.getTarget();
          const source = sourceNode.getModel().id;
          const target = targetNode.getModel().id;
          if (sourceNode.get('visible') && source === item.getModel().id && !nodeSet.has(target)) {
            if (staticMode) {
              if (currentDepth === depth) {
                nodeSet.add(target);
                edgeSet.add(edge);
              }
            } else {
              nodeSet.add(target);
              edgeSet.add(edge);
            }
            queue.push(graph.findById(target));
          }

          if (targetNode.get('visible') && target === item.getModel().id && !nodeSet.has(source)) {
            if (staticMode) {
              if (currentDepth === depth) {
                nodeSet.add(source);
                edgeSet.add(edge);
              }
            } else {
              nodeSet.add(source);
              edgeSet.add(edge);
            }
            queue.push(graph.findById(source));
          }
        });
      }
      currentDepth++;
    }
    resultNodes = _.concat(resultNodes, [...nodeSet]);
    resultEdges = _.concat(resultEdges, [...edgeSet]);
  });

  resultNodes = _.union(resultNodes);
  resultEdges = _.unionBy(resultEdges, (item: any) => item._cfg.id);
  const nodes = resultNodes.map((id: any) => graph?.findById(id)?.getModel()?._sourceData);
  const edges = resultEdges.map((edge: any) => {
    const data = edge?.getModel()?._sourceData;
    return { ...data, source: data?.relation?.[0], target: data?.relation?.[2] };
  });

  if (!_.isEmpty(filters)) {
    let satisfyNodes: any = [];
    let satisfyEdges: any = [];
    _.forEach(filters, filtersItem => {
      const { e_filters, v_filters } = filtersItem;
      const filterNodes = _.filter(nodes, node => {
        let isCompliant = true;
        _.forEach(v_filters, (vFilter, index) => {
          const satisfy = ['satisfy_all', 'satisfy_any'];
          let group = true;

          if (node?.class !== vFilter?.tag && satisfy.includes(vFilter?.type)) {
            group = false;
          } else if (node?.class !== vFilter?.tag && !satisfy.includes(vFilter?.type)) {
            group = true;
          } else {
            if (vFilter?.type === 'satisfy_all') {
              group = _.every(vFilter?.property_filters, p => {
                const { value, type } = node?.showLabels?.find((prop: any) => prop.key === p.name);
                return getSatisfyValue(p, value, type);
              });

              if (vFilter?.property_filters?.length === 0) group = true;
            }
            if (vFilter?.type === 'satisfy_any') {
              group = _.some(vFilter?.property_filters, p => {
                const { value, type } = node?.showLabels?.find((prop: any) => prop.key === p.name);
                return getSatisfyValue(p, value, type);
              });

              if (vFilter?.property_filters?.length === 0) group = true;
            }
            if (vFilter?.type === 'unsatisfy_all') {
              group = !_.some(vFilter?.property_filters, p => {
                const { value, type } = node?.showLabels?.find((prop: any) => prop.key === p.name);
                return getSatisfyValue(p, value, type);
              });
              if (vFilter?.property_filters?.length === 0) group = false;
            }
            if (vFilter?.type === 'unsatisfy_any') {
              group = !_.every(vFilter?.property_filters, p => {
                const { value, type } = node?.showLabels?.find((prop: any) => prop.key === p.name);
                return getSatisfyValue(p, value, type);
              });
              if (vFilter?.property_filters?.length === 0) group = false;
            }
          }

          if (Number(index) === 0) isCompliant = group;

          if (Number(index) !== 0) {
            isCompliant = vFilter?.relation === 'and' ? isCompliant && group : isCompliant || group;
          }
        });

        return isCompliant;
      });
      const filterEdges = _.filter(edges, edge => {
        let isCompliant = true;
        _.forEach(e_filters, (eFilter, index) => {
          const satisfy = ['satisfy_all', 'satisfy_any'];
          let group = true;
          if (edge?.class !== eFilter?.edge_class && satisfy.includes(eFilter?.type)) {
            group = false;
          } else if (edge?.class !== eFilter?.edge_class && !satisfy.includes(eFilter?.type)) {
            group = true;
          } else {
            if (eFilter?.type === 'satisfy_all') {
              group = _.every(eFilter?.property_filters, p => {
                const { value, type } = edge?.showLabels?.find((prop: any) => prop.key === p.name);
                return getSatisfyValue(p, value, type);
              });

              if (eFilter?.property_filters?.length === 0) group = true;
            }
            if (eFilter?.type === 'satisfy_any') {
              group = _.some(eFilter?.property_filters, p => {
                const { value, type } = edge?.showLabels?.find((prop: any) => prop.key === p.name);
                return getSatisfyValue(p, value, type);
              });

              if (eFilter?.property_filters?.length === 0) group = true;
            }
            if (eFilter?.type === 'unsatisfy_all') {
              group = !_.some(eFilter?.property_filters, p => {
                const { value, type } = edge?.showLabels?.find((prop: any) => prop.key === p.name);
                return getSatisfyValue(p, value, type);
              });
              if (eFilter?.property_filters?.length === 0) group = false;
            }
            if (eFilter?.type === 'unsatisfy_any') {
              group = !_.every(eFilter?.property_filters, p => {
                const { value, type } = edge?.showLabels?.find((prop: any) => prop.key === p.name);
                return getSatisfyValue(p, value, type);
              });
              if (eFilter?.property_filters?.length === 0) group = false;
            }
          }

          if (Number(index) === 0) isCompliant = group;

          if (Number(index) !== 0) {
            isCompliant = eFilter?.relation === 'and' ? isCompliant && group : isCompliant || group;
          }
        });

        return isCompliant;
      });
      satisfyNodes = _.concat(satisfyNodes, filterNodes);
      satisfyEdges = _.concat(satisfyEdges, filterEdges);
    });
    satisfyNodes = _.unionBy(satisfyNodes, (n: any) => n?.id);
    satisfyEdges = _.unionBy(satisfyEdges, (e: any) => e?.id);

    const nIds = _.concat(
      _.map(satisfyNodes, n => n?.id),
      nodeIds
    );
    const finalNodes: any = [];
    satisfyEdges = _.filter(satisfyEdges, edge => {
      const { source, target } = edge;
      if (_.includes(nIds, source) && _.includes(nIds, target)) {
        finalNodes.push(source);
        finalNodes.push(target);
        return true;
      }
      return false;
    });
    satisfyNodes = _.filter(satisfyNodes, node => _.includes(finalNodes, node?.id));
    return { nodes: satisfyNodes, edges: satisfyEdges };
  }
  return { nodes: _.uniqBy(nodes, 'id'), edges: _.uniqBy(edges, 'id') };
};

const getEdgesByDirection = (node: any, direction: any) => {
  switch (direction) {
    case 'reverse':
      return node.getInEdges();
    case 'positive':
      return node.getOutEdges();
    default:
      return node.getEdges();
  }
};
