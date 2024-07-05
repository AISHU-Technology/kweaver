import type { GraphData } from '@antv/g6';

class GraphStore {
  store: any;
  forceUpdate: () => void;

  graph: any;
  constructor(forceUpdate: () => void) {
    this.store = {
      zoom: 1,
      stack: {},
      graphStyle: {},
      graphConfig: {},
      layoutConfig: {},
      add: { nodes: [], edges: [] },
      delete: { nodes: [], edges: [] },
      config: {},
      graphData: { nodes: [], edges: [] },
      selected: { nodes: [], edges: [] },
      rules: {},
      sliced: {},
      loading: false,
      exploring: {},
      focusItem: {}
    };
    this.forceUpdate = forceUpdate;
  }

  init(data: any) {
    const { graph, store = {} } = data || {};
    this.graph = graph ?? {};
    this.store = { ...this.store, ...store };
    this.forceUpdate();
  }

  /** 获取图谱节点 */
  getNodes() {
    return this.graph.getNodes();
  }

  /** 获取图谱边*/
  getEdges() {
    return this.graph.getEdges();
  }

  /** 修改 store */
  onChangeStore(data: any, beforeChangeStore: (data: any) => boolean, afterChangeStore: (data: any) => void) {
    const intercept: boolean = beforeChangeStore?.(data);
    if (intercept === false) return;
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        if (!this.store[key]) return;
        this.store[key] = data[key];
      }
    }
    afterChangeStore?.(this.store);
  }

  /** 修改数据源 */
  changeData(data: GraphData) {
    if (!this.graph) return;
    this.graph.changeData(data);
  }
}

/* eslint-disable-next-line*/
export interface GraphStoreFace extends GraphStore {}

export default GraphStore;
