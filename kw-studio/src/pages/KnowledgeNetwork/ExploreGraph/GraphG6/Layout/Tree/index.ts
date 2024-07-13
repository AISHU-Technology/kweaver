import _ from 'lodash';
import G6 from '@antv/g6';

import { GRAPH_LAYOUT_TREE_DIR } from '@/enums';
import { getIconCode } from '@/utils/antv6/getIconMore';
import { tick } from '@/utils/handleFunction';

import { themeColor } from '../../enums';
import { GraphStack, InteractiveToIframe } from '../../utils';
import { IframeTree } from '../extendGraphForIframe';
import { getLabelValues, constructGraphTreeData } from './constructGraphData';

type ItemType = { id: string; [key: string]: any };
type SourceType = {
  nodes: ItemType[];
  edges: ItemType[];
  action?: 'add' | 'cover';
  newData?: { node: ItemType[]; edge: ItemType[] };
};
type InitType = {
  source: SourceType;
  container: any;
  config: any;
  cache: any;
};
/**
 * 紧凑树布局
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
class LayoutTree {
  source: any;
  config: any;
  cache: any;

  graph: any;
  container: any;
  isFirst: boolean;
  interactiveToIframe: any;
  constructor(data: InitType) {
    // 需要同步的参数: source config, cache
    const { source, config, cache, container } = data;
    this.source = source;
    this.config = config;
    this.cache = cache;
    this.container = container;

    // 初始数据
    this.isFirst = true;

    const initData: Omit<InitType, 'source' | 'cache'> = { container, config };
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
  set IsFirst(data: any) {
    this.isFirst = data;
  }

  removeEventListener() {
    this.interactiveToIframe?.offMessage();
  }

  /** 初始化紧凑树布局图谱 */
  init(props: any) {
    const { container, config } = props;
    const { hGap, vGap, direction } = config;
    const Graph = G6.TreeGraph;
    this.graph = new Graph({
      container,
      modes: {
        default: [
          'ac-edge',
          'drag-canvas',
          'subGroup-Behavior',
          'path-Behavior',
          { type: 'zoom-canvas', minZoom: 0.05, maxZoom: 4.1, sensitivity: 1 },
          {
            type: 'brush-select',
            selectedState: '_selected',
            brushStyle: { fill: 'rgba(18, 110, 227, 0.04)', stroke: '#126EE3' }
          },
          {
            type: 'collapse-expand',
            shouldBegin: (ev: any) => {
              if (ev?.target?.cfg?.name !== 'tree-badge') return false;
              return true;
            },
            onChange: (item: any, collapsed: any) => {
              if (!item._cfg?.model?.isAgencyNode) return;
              const model = item.getModel();
              let nodeIcon: any = null;
              _.forEach(item?.getContainer()?.get('children'), item => {
                if (item.cfg.name === 'tree-badge') nodeIcon = item;
              });
              const newSourceData = model._sourceData;
              if (collapsed && nodeIcon) {
                nodeIcon.attr({ text: getIconCode('graph-plus-circle') });
                item.update({ _sourceData: { ...newSourceData, icon: 'graph-plus-circle' } });
              }
              if (!collapsed && nodeIcon) {
                nodeIcon.attr({ text: getIconCode('graph-reduce-circle') });
                item.update({ _sourceData: { ...newSourceData, icon: 'graph-reduce-circle' } });
                setTimeout(() => {
                  const { hGap, vGap, direction } = this.config;
                  this.resetAnchor(direction, hGap, vGap);
                });
              }
            }
          }
        ]
      },
      defaultNode: {
        type: 'customCircle',
        anchorPoints: [
          [0, 0.5],
          [1, 0.5],
          [0.5, 0],
          [0.5, 1]
        ]
      },
      defaultEdge: {
        // type: 'line'
        type: 'customPolyline'
      },
      layout: {
        type: 'compactBox',
        direction: direction || GRAPH_LAYOUT_TREE_DIR.DEFAULT_CONFIG.direction,
        getId: (d: any) => d.id,
        getHGap: () => {
          return hGap || GRAPH_LAYOUT_TREE_DIR.DEFAULT_CONFIG.hGap;
        },
        getVGap: () => {
          return vGap || GRAPH_LAYOUT_TREE_DIR.DEFAULT_CONFIG.vGap;
        },
        getWidth: (item: any) => {
          return item._layoutWidth || 50;
        },
        getSide: (d: any) => {
          return d.data?.side || 'right';
        }
      }
    });
    this.graph.graphStack = new GraphStack(this.graph);

    this.graph.get('canvas').set('localRefresh', false);
    this.graph.data({ id: 'groupTreeNodeTemp', type: 'circle', isTemp: true, children: [] });
    this.graph.render();
    this.graph.fitView();

    const root = this.graph.findById('groupTreeNodeTemp');
    this.graph.removeItem(root);
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
    // 筛除已存在树图上的点
    addData.nodes = _.filter(addData.nodes, item => !sourceNodesKV[item.id]);
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

    const afterAddData: any = { addData, beforeData };
    if (callback) afterAddData.callback = callback;
    const _callback = () => {
      this.pushStackAfterAddItems(afterAddData);
    };

    this.changeData(
      { nodes: _nodes, edges: _edges, newData: { node: pickAddNodes, edge: pickAddEdges } },
      {},
      _callback
    );
  }

  /** 删除点和边，并且推入操作栈 */
  delete(data: any, callBack: any) {
    let { nodes = [], edges = [] } = data;
    const _nodes = nodes;
    nodes = [];

    const deleteData: any = {
      nodes: [],
      edges: []
    };

    const beforeData = {
      nodes: _.map(this.graph.getNodes(), item => item.getModel()),
      edges: _.map(this.graph.getEdges(), item => item.getModel())
    };

    const sources: any = [];
    const targets: any = [];
    const getChildren = (source: any) => {
      _.forEach(source || [], item => {
        nodes.push(item);
        const neighborEdges = item?.getEdges() || [];
        edges = edges.concat(neighborEdges);

        const edgesIn = item.getInEdges()?.[0];
        const edgesOut = item.getOutEdges();
        if (edgesIn?._cfg) sources.push(edgesIn._cfg.source);
        _.forEach(edgesOut, item => {
          if (item?._cfg?.target?._cfg?.model?.isAgencyNode) targets.push(item._cfg.target);
        });

        let nextNodes: any = [];
        const nodeTargets = item.getNeighbors('target');
        _.forEach(nodeTargets, d => {
          if (d.getModel().isAgencyNode) nextNodes = [...nextNodes, ...d.getNeighbors('target')];
        });
        getChildren(nextNodes);
      });
    };
    getChildren(_nodes);

    nodes = _.unionBy(nodes, (d: any) => d?._cfg?.id);
    edges = _.unionBy(edges, (d: any) => d?._cfg?.id);

    _.forEach(edges || [], item => {
      if (item?.getModel()?._sourceData) deleteData.edges.push(item.getModel()._sourceData);
      Promise.resolve().then(() => this.graph.clearItemStates(item));
      Promise.resolve().then(() => this.graph.removeItem(item, false));
    });
    _.forEach(nodes || [], item => {
      if (item?.getModel()?._sourceData) deleteData.nodes.push(item.getModel()._sourceData);
      Promise.resolve().then(() => this.graph.clearItemStates(item));
      Promise.resolve().then(() => this.graph.removeItem(item, false));
    });

    setTimeout(() => {
      if (!_.isEmpty(sources)) {
        // 处理聚合边类删除问题
        let _sources = _.unionBy(sources, (d: any) => d?._cfg?.id);
        _sources = _.filter(_sources, (d: any) => d?._cfg);
        _.forEach(_sources, item => {
          if (!item?._cfg?.model?.isAgencyNode) return;
          if (!this.graph.findById(item?._cfg?.id)) return;
          const moreNode = _.filter(item._cfg.children, d => d._cfg?.model?.isMore)?.[0];
          const children = _.filter(item._cfg.children, d => !d.destroyed && !d._cfg?.model?.isMore);
          if (children.length) return;

          Promise.resolve().then(this.graph.removeItem(item, false));
          Promise.resolve().then(() => this.graph.removeItem(moreNode, false));
        });
      }
      if (!_.isEmpty(targets)) {
        // 处理聚合边类删除问题
        let _targets = _.unionBy(targets, (d: any) => d?._cfg?.id);
        _targets = _.filter(_targets, (d: any) => d?._cfg);
        _.forEach(_targets, item => {
          if (!this.graph.findById(item?._cfg?.id)) return;
          Promise.resolve().then(this.graph.removeItem(item, false));
        });
      }

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
    this.graph.__isGroup = this.config.isGroup;

    const { hGap, vGap, limit, isGroup, direction } = this.config;

    const { result, edges } = constructGraphTreeData(
      this.source,
      {
        limit,
        isGroup,
        direction,
        themeColor,
        ...(option || {})
      },
      this.cache
    );
    if (_.isEmpty(result)) return;

    /**
     * [bug 409928] 存在子图时修改树布局的分组、层间距配置, 页面白屏
     * 修改这两个配置触发的read导致子图实例被销毁, 所以在read前取出配置, read后重绘子图
     * 并且树图更新后没有回调, 子图绘制不准确, 需要在resetAnchor方法中用tick函数重复触发子图更新
     */
    const groups = this.graph?.__getSubGroups?.();
    this.graph.read(result);
    setTimeout(() => {
      _.forEach(
        _.values(groups),
        g =>
          g.cfg &&
          this.graph?.__createSubGroup?.({
            id: g.id,
            name: g.name,
            from: 'clusters',
            members: g.cfg.info.nodes,
            info: g.cfg.info,
            style: g.cfg.style
          })
      );
      this.recoverTreeEdge(edges);
      this.resetAnchor(direction, hGap, vGap, !!_.values(groups).length);
      if (callback) callback();
    }, 0);
  }

  /** 布局配置变更 */
  changeConfig(config: any) {
    if (_.isEmpty(this.graph.getNodes())) return;
    this.config = config;

    try {
      const { hGap, vGap, limit, isGroup, direction } = this.config;
      this.graph.__isNotFitView = true;

      const { result, edges } = constructGraphTreeData(
        this.source,
        {
          limit,
          isGroup,
          direction,
          themeColor
        },
        this.cache
      );
      this.graph.read(result);
      setTimeout(() => {
        this.graph.changeLayout({
          type: 'compactBox',
          direction: direction || GRAPH_LAYOUT_TREE_DIR.LR,
          getId: (d: any) => d.id,
          getHGap: () => {
            return hGap || 80;
          },
          getVGap: () => {
            return vGap || 80;
          },
          getWidth: (item: any) => {
            return item._layoutWidth || 50;
          },
          getSide: (d: any) => {
            return d.data?.side || 'right';
          }
        });
        this.resetAnchor(direction, hGap, vGap);
        this.recoverTreeEdge(edges);
      });
    } catch (error) {
      //
    }
  }

  /**
   * 更新锚点
   * @param direction
   * @param hGap
   * @param vGap
   * @param needTick 需要重复触发更新解决子图渲染问题
   */
  resetAnchor(direction: string, hGap: number, vGap: number, needTick = false) {
    const anchorObject: any = {
      LR: { sourceAnchor: 1, targetAnchor: 0 },
      RL: { sourceAnchor: 0, targetAnchor: 1 },
      TB: { sourceAnchor: 3, targetAnchor: 2 },
      BT: { sourceAnchor: 2, targetAnchor: 3 }
    };
    _.forEach(this.graph.getEdges(), item => {
      if (direction === 'V') {
        const sourceY = item._cfg?.source?._cfg?.model?.y;
        const targetY = item._cfg?.target?._cfg?.model?.y;
        if (sourceY > targetY) {
          this.graph.updateItem(item, { ...anchorObject.BT, _direction: 'BT', _hGap: hGap, _vGap: vGap });
        } else {
          this.graph.updateItem(item, { ...anchorObject.TB, _direction: 'TB', _hGap: hGap, _vGap: vGap });
        }
      } else if (direction === 'H') {
        const sourceX = item._cfg?.source?._cfg?.model?.x;
        const targetX = item._cfg?.target?._cfg?.model?.x;
        if (sourceX > targetX) {
          this.graph.updateItem(item, { ...anchorObject.RL, _direction: 'RL', _hGap: hGap, _vGap: vGap });
        } else {
          this.graph.updateItem(item, { ...anchorObject.LR, _direction: 'LR', _hGap: hGap, _vGap: vGap });
        }
      } else {
        this.graph.updateItem(item, { ...anchorObject[direction], _direction: direction, _hGap: hGap, _vGap: vGap });
      }
    });
    if (needTick) {
      tick(
        () => {
          this.graph.emit('afterupdateitem', {}); // 触发afterupdateitem事件重绘子图
        },
        300,
        5
      );
    }
  }

  /** 恢复edge的样式 */
  recoverTreeEdge(edges: any) {
    if (this.graph.__isGroup) {
      const edgesKV = _.keyBy(edges || [], 'id');
      _.forEach(this.graph.getEdges(), edge => {
        const source = edge?._cfg?.source?._cfg?.model?.isAgencyNode;
        const data: any = { style: { cursor: 'default' }, isGroup: true };
        if (source) {
          const target = edge?._cfg?.model?.target;
          const fatherId = edge?._cfg?.source?._cfg?.model?.fatherId;
          const groupName = edge?._cfg?.source?._cfg?.model?.groupName;
          const key = `${groupName}:"${fatherId}"->"${target}"`;
          const key2 = `${groupName}:${fatherId}-${target}`;
          if (edgesKV[key]) {
            data.id = key;
            data._sourceData = edgesKV[key];
          }
          if (edgesKV[key2]) {
            data.id = key2;
            data._sourceData = edgesKV[key2];
          }
        }
        this.graph.updateItem(edge, data, false);
      });
    } else {
      const edgesKV: any = {};
      _.forEach(edges, edge => {
        edgesKV[`${edge?.source}:${edge?.target}`] = edge;
      });
      _.forEach(this.graph.getEdges(), edge => {
        const { source, target } = edge?.getModel();
        const key = `${source}:${target}`;
        const item = edgesKV[key];
        if (!item) {
          if (edge._cfg.target._cfg.model.isMore) this.graph.updateItem(edge, { isMore: true }, false);
          return;
        }

        edge._cfg.id = item.id;
        const { id, color, strokeColor, lineWidth, showLabels } = item;
        const label = getLabelValues(showLabels);
        const data = {
          id,
          label,
          isTreeEdge: true,
          style: { lineWidth: lineWidth || 1, stroke: strokeColor || color },
          _sourceData: item
        };
        this.graph.updateItem(edge, data, false);
      });
    }
  }

  /** 添加点和边完成后推入操作栈 */
  pushStackAfterAddItems({ addData, beforeData, callback }: any) {
    if (callback) {
      let nodes = _.map(addData?.nodes, item => this.graph.findById(item?.id));
      nodes = _.filter(nodes, item => !!item);
      callback(nodes);
    }

    const afterData = {
      nodes: _.map(this.graph.getNodes(), item => item.getModel()),
      edges: _.map(this.graph.getEdges(), item => item.getModel())
    };
    this.graph.graphStack.pushStack('add', { before: beforeData, after: afterData });
  }
}

export default LayoutTree;
