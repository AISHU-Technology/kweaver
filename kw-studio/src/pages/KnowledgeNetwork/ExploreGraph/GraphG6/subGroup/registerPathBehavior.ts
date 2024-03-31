import _ from 'lodash';
import G6 from '@antv/g6';

/**
 * 处理路径的hover和点击select行为
 * @param name 行为模式名称, 默认`path-Behavior`
 */
export default function registerPathBehavior(name = 'path-Behavior', onChangeData: Function) {
  const hoveCache: any = {};

  const getPaths = (node: any, graph: any) => {
    const id = node.get('id');
    const subGroups = graph?.__getSubGroups?.();
    const pathGroups = _.values(subGroups).filter(g => g.cfg?.info?.groupType === 'path');
    const idMap: any = {};
    const totalMap: any = {};
    _.forEach(pathGroups, g => {
      const { nodes = [], edges = [] } = g.cfg?.info || {};
      const ids = _.keyBy([...nodes, ...edges]);
      Object.assign(totalMap, ids);
      if (_.includes(nodes, id) || _.includes(edges, id)) {
        Object.assign(idMap, ids);
      }
    });
    return [idMap, totalMap];
  };

  const onEnter = (e: any, graph: any) => {
    const { item, targetPath } = e;
    if (!item) return;
    const pathsMap = targetPath
      ? _.keyBy([...(targetPath.cfg?.info?.nodes || []), ...(targetPath.cfg?.info?.edges || [])])
      : getPaths(item, graph)[0];
    if (_.isEmpty(pathsMap)) return;
    _.forEach([...graph.getNodes(), ...graph.getEdges()], shape => {
      const id = shape.get('id');
      if (pathsMap[id] && !shape.hasState('selected')) {
        graph.setItemState(shape, '_hover', true);
        graph.priorityState(shape, '_hover');
        hoveCache[id] = shape;
      }
    });
  };

  const onLeave = (e: any, graph: any) => {
    const { item } = e;
    if (!item) return;
    if (_.isEmpty(hoveCache)) return;
    _.forEach(_.values(hoveCache), shape => {
      if (!shape || shape?.destroyed) return;
      graph.clearItemStates(shape, '_hover');
    });
  };

  /**
   * 点击选中路径, 如果有targetPath则只选择指定路径, 否则选中经过该节点的所有路径
   * @param e
   * @param graph
   */
  const onClick = (e: any, graph: any) => {
    const { item, targetPath } = e;
    if (!item) return;
    // eslint-disable-next-line prefer-const
    let [pathsMap, totalMap] = getPaths(item, graph);
    if (targetPath) {
      pathsMap = _.keyBy([...(targetPath.cfg?.info?.nodes || []), ...(targetPath.cfg?.info?.edges || [])]);
    }
    if (_.isEmpty(pathsMap)) return;
    //  点击单个元素的select事件是300延时, 这里延时久一些, 否则这里会被覆盖
    const shadowShape: any[] = [];
    setTimeout(() => {
      const nodes = _.filter(graph.getNodes(), node => {
        const id = node.get('id');
        if (!totalMap[id]) shadowShape.push(node);
        return !!pathsMap[id];
      });
      const edges = _.filter(graph.getEdges(), edge => {
        const id = edge.get('id');
        if (!totalMap[id]) shadowShape.push(edge);
        return !!pathsMap[id];
      });
      onChangeData({ type: 'selected', data: { focusItem: item, nodes, edges, length: nodes.length + edges.length } });
      // change selected 也会更新样式, 为防止样式覆盖再次等待
      setTimeout(() => {
        _.forEach(shadowShape, shape => {
          graph.clearItemStates(shape);
          graph.setItemState(shape, '_shallow', true);
        });
      }, 0);
    }, 333);
  };

  G6.registerBehavior(name, {
    getEvents() {
      return {
        'node:mouseenter': 'onNodeEnter',
        'node:mouseleave': 'onNodeLeave',
        'node:click': 'onNodeClick',
        'edge:mouseenter': 'onEdgeEnter',
        'edge:mouseleave': 'onEdgeLeave',
        'edge:click': 'onEdgeClick'
      };
    },
    onNodeEnter(e: any) {
      const graph = this.graph;
      onEnter(e, graph);
    },
    onNodeLeave(e: any) {
      const graph = this.graph;
      onLeave(e, graph);
    },
    onEdgeEnter(e: any) {
      const graph = this.graph;
      onEnter(e, graph);
    },
    onEdgeLeave(e: any) {
      const graph = this.graph;
      onLeave(e, graph);
    },
    onNodeClick(e: any) {
      const graph = this.graph;
      onClick(e, graph);
    },
    onEdgeClick(e: any) {
      const graph = this.graph;
      onClick(e, graph);
    }
  });
}
