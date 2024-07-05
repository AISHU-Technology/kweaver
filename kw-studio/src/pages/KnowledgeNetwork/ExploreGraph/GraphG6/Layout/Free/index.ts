import _ from 'lodash';
import G6 from '@antv/g6';

import { GraphStack, InteractiveToIframe } from '../../utils';
import { IframeGraph } from '../extendGraphForIframe';
import { constructGraphFreeData } from './constructGraphData';
import workerConfig from '../worker.config';

type ItemType = { id: string; [key: string]: any };
type SourceType = { nodes: ItemType[]; edges: ItemType[]; action?: 'add' | 'cover' };
type InitType = {
  source: SourceType;
  container: any;
  cache: any;
  isFirst: boolean;
  defaultStyle: { edge: any; node: any };
};

/**
 * 自由布局
 * @class
 * @constructs get Graph
 * @constructs set Source
 * @constructs set Config
 * @constructs set Cache
 * @function init 初始化自由布局图谱
 * @function add 添加点和边
 * @function delete 删除点和边, 并且推入操作栈
 * @function changeData 数据源变更
 * @function changeConfig 布局配置变更
 */
class LayoutFree {
  source: any;
  config: any;
  cache: any;
  defaultStyle: { edge: any; node: any };

  graph: any;
  layoutEndData: any;
  isFirst: boolean;
  interactiveToIframe: any;
  constructor(data: InitType) {
    // 需要同步的参数: source cache
    const { source, cache, container, isFirst, defaultStyle } = data;
    this.source = source;
    this.cache = cache;
    this.defaultStyle = defaultStyle;

    // 初始数据
    this.isFirst = false;

    const initData: Omit<InitType, 'source' | 'cache' | 'isFirst' | 'defaultStyle'> = { container };

    this.init(initData);
  }

  get Graph() {
    return this.graph;
  }
  set Source(data: SourceType) {
    this.source = data;
  }

  set Config(data: any) {
    this.config = data;
  }
  set Cache(data: any) {
    this.cache = data;
  }
  set DefaultStyle(data: any) {
    this.defaultStyle = data;
  }
  set IsFirst(data: any) {
    this.isFirst = data;
  }

  removeEventListener() {
    this.interactiveToIframe?.offMessage();
  }

  /** 初始化自由布局图谱 */
  init(props: any) {
    const { container } = props;
    const Graph = G6.Graph;
    this.graph = new Graph({
      container,
      linkCenter: true,
      modes: {
        default: [
          'drag-node',
          'drag-canvas',
          'subGroup-Behavior',
          'path-Behavior',
          { type: 'zoom-canvas', minZoom: 0.05, maxZoom: 4.1, sensitivity: 1 },
          {
            type: 'brush-select',
            selectedState: '_selected',
            brushStyle: { fill: 'rgba(18, 110, 227, 0.04)', stroke: '#126EE3' }
          }
        ],
        addEdge: ['add-edge', 'drag-canvas', 'zoom-canvas', 'drag-node']
      },
      defaultNode: { type: 'customCircle' },
      defaultEdge: { type: 'customLine' },
      layout: {
        type: 'gForce',
        ...workerConfig,
        // gpuEnabled: true,
        maxSpeed: 4000,
        minMovement: 0.6,
        nodeSpacing: 100,
        linkDistance: 200,
        maxIteration: 100,
        nodeStrength: 2000,
        preventOverlap: true,
        coulombDisScale: 0.008,
        onLayoutEnd: () => {
          if (!this.layoutEndData) return;
          this.pushStackAfterAddItems(this.layoutEndData);
          this.layoutEndData = null;
        }
      }
    });
    this.graph.graphStack = new GraphStack(this.graph);

    this.graph.get('canvas').set('localRefresh', false);
    this.graph.render();
  }

  /** 添加点和边 */
  add(_addData: SourceType, callback: any) {
    const addData = _.cloneDeep(_addData);
    _.forEach(this.graph.getNodes(), item => this.graph.clearItemStates(item));
    _.forEach(this.graph?.getEdges(), item => this.graph.clearItemStates(item));

    // 为了使样式作用于新添加的元素，在添加时筛选出当前图谱中未存在的元素
    const pickAddNodes: any = {};
    const pickAddEdges: any = {};
    const sourceNodesKV = _.keyBy(this.source.nodes, 'id');
    const sourceEdgesKV = _.keyBy(this.source.edges, 'id');
    const visibleKV: any = {};
    _.forEach(addData.nodes, item => {
      item.hide = false; // WARNING 添加的点始终显示, 直接修改引用类型数据
      visibleKV[item.id] = true;
      if (addData.action === 'cover' || !sourceNodesKV[item?.id]) pickAddNodes[item.id] = item;
    });
    _.forEach(addData.edges, item => {
      item.hide = false;
      visibleKV[item.id] = true;
      if (addData.action === 'cover' || !sourceEdgesKV[item?.id]) pickAddEdges[item.id] = item;
    });
    // 为了使样式作用于新添加的元素，在添加时筛选出当前图谱中未存在的元素
    const beforeDataNodes = _.map(this.graph.getNodes(), item => item.getModel());
    const beforeDataEdges = _.map(this.graph.getEdges(), item => item.getModel());
    const beforeData = {
      nodes: beforeDataNodes,
      edges: beforeDataEdges,
      newData: { nodes: _.values(pickAddNodes), edges: _.values(pickAddEdges) }
    };

    // 构建画布数据并更新, `cover`表示清空画布重新添加
    let _nodes = [...(addData.nodes || [])];
    let _edges = [...(addData.edges || [])];
    if (addData.action !== 'cover') {
      _.forEach(this.source.nodes, d => _nodes.unshift({ ...d, hide: visibleKV[d.id] ? false : d.hide }));
      _.forEach(this.source.edges, d => _edges.unshift({ ...d, hide: visibleKV[d.id] ? false : d.hide }));
    }

    _nodes = _.unionBy(_nodes, (d: any) => d?.id);
    _edges = _.unionBy(_edges, (d: any) => d?.id);
    const { nodes, edges } = constructGraphFreeData(
      {
        nodes: _nodes,
        edges: _edges,
        newData: { node: pickAddNodes, edge: pickAddEdges },
        defaultStyle: this.defaultStyle,
        isFirst: this.isFirst
      },
      this.cache
    );

    const afterAddData: any = { addData, beforeData };
    if (callback) afterAddData.callback = callback;
    this.layoutEndData = afterAddData;
    this.graph.updateLayout({ workerEnabled: nodes.length > 3000 });
    this.graph.changeData({ nodes, edges });
  }

  /** 删除点和边, 并且推入操作栈 */
  delete(data: any, callBack: any) {
    let { nodes = [], edges = [] } = data;

    const beforeData = {
      nodes: _.map(this.graph.getNodes(), item => item.getModel()),
      edges: _.map(this.graph.getEdges(), item => item.getModel())
    };

    _.forEach(nodes, item => {
      const neighborEdges = item?.getEdges() || [];
      edges = edges.concat(neighborEdges);
    });
    nodes = _.unionBy(nodes, (d: any) => d?._cfg?.id);
    edges = _.unionBy(edges, (d: any) => d?._cfg?.id);

    const deleteData: any = {
      nodes: [],
      edges: []
    };
    _.forEach(edges || [], item => {
      deleteData.edges.push(item?.getModel()?._sourceData);
      Promise.resolve().then(() => this.graph.clearItemStates(item));
      Promise.resolve().then(() => this.graph.removeItem(item, false));
    });
    _.forEach(nodes || [], item => {
      deleteData.nodes.push(item?.getModel()?._sourceData);
      Promise.resolve().then(() => this.graph.clearItemStates(item));
      Promise.resolve().then(() => this.graph.removeItem(item, false));
    });

    setTimeout(() => {
      // 栈操作
      const afterData = {
        deleteData,
        nodes: _.map(this.graph.getNodes(), item => item.getModel()),
        edges: _.map(this.graph.getEdges(), item => item.getModel())
      };

      if (callBack) callBack(deleteData);
      this.graph.graphStack.getRedoStack()?.clear();
      this.graph.graphStack.pushStack('delete', { before: beforeData, after: afterData });
    });
  }

  /** 数据源变更 */
  changeData(source: SourceType, option?: any, callback?: any) {
    this.source = source;
    const tempData = { nodes: [], edges: [] };
    const newData = constructGraphFreeData(
      { ...this.source, defaultStyle: this.defaultStyle, isFirst: this.isFirst } || tempData
    );
    this.isFirst = false;
    this.graph.updateLayout({ workerEnabled: newData.nodes.length > 3000 });
    this.graph.changeData(newData);
    this.graph.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
    if (callback) callback();
  }

  /** 布局配置变更 暂无 - 占位 */
  changeConfig() {}

  /** 添加点和边完成后推入操作栈 */
  pushStackAfterAddItems({ addData, beforeData, callback }: any) {
    if (callback) {
      let nodes = _.map(addData?.nodes, item => this.graph.findById(item?.id));
      let edges = _.map(addData?.edges, item => this.graph.findById(item?.id));
      nodes = _.filter(nodes, item => !!item);
      edges = _.filter(edges, item => !!item);
      callback(nodes, edges);
    }

    const afterData = {
      nodes: _.map(this.graph.getNodes(), item => item.getModel()),
      edges: _.map(this.graph.getEdges(), item => item.getModel())
    };
    this.graph.graphStack.pushStack('add', { before: beforeData, after: afterData });
  }
}

export default LayoutFree;
