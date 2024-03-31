import type { GraphData } from '@antv/g6';

// zoom: number,
// stack: any,
// graphStyle: any;
// graphConfig: any;
// layoutConfig: any;
// add: any;
// delete: any;
// config: any;
// graphData: any;
// selected: any;
// rules: any;
// sliced: any;
// loading: any;
// exploring: any;
// focusItem: any;
class GraphStore {
  store: any;
  forceUpdate: () => void;

  graph: any;
  constructor(forceUpdate: () => void) {
    this.store = {
      zoom: 1, // 图谱缩放比例
      stack: {}, // 操作栈信息
      graphStyle: {}, // 图谱样式数据
      graphConfig: {}, // 图谱配置数据
      layoutConfig: {}, // 布局配置数据
      add: { nodes: [], edges: [] }, // 增加节点和边
      delete: { nodes: [], edges: [] }, // 删除节点和边
      config: {}, // 图谱样式修改
      graphData: { nodes: [], edges: [] }, // 图谱数据
      selected: { nodes: [], edges: [] }, // 选中节点和边
      rules: {}, // 搜索规则
      sliced: {}, // 图切片数据
      loading: false,
      exploring: {}, // 查询状态
      focusItem: {} // 聚焦的节点

      // path // 路径信息
      // detail // 图谱分析详情
      // newCanvas // 新建图谱分析数据
    }; // 状态库
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
