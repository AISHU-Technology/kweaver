import G6 from '@antv/g6';
import type { GraphOptions } from '@antv/g6';

const Graph = G6.Graph;
const TreeGraph = G6.TreeGraph;

const createBaseGraphStore = (extend: any) => {
  return class extends extend {
    /* eslint-disable-next-line*/
    constructor(props: GraphOptions) {
      super(props);
    }

    /** 获取节点 */
    getNodes() {
      return super.getNodes();
    }
    /** 获取边 */
    getEdges() {
      return super.getEdges();
    }
  };
};

const BaseGraph = createBaseGraphStore(Graph);
const BaseTreeGraph = createBaseGraphStore(TreeGraph);

export { BaseGraph, BaseTreeGraph };
