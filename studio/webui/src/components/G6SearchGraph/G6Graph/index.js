/* eslint-disable */
/**
 * @description G6图谱渲染
 * @author Eden
 * @date 2022/01/05
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import G6 from '@antv/g6';
import IconFont from '@/components/IconFont';
import servicesExplore from '@/services/explore';
import {
  hoverIn,
  hoverOut,
  addToolPanel,
  setInfoPosition,
  setInAndOutposition,
  getRelationByNode,
  handleEXData,
  getExpandHandleData,
  getEdgesByNode,
  drawMark
} from './assistFunction';
import Information from './Information';
import InAndOut from './InAndOut';
import ModalDelete from './ModalDelete';
import AnalysisModal from './Analysis';
import ZoomTool from './LeftZoomTool';
import { DELETE, IN, OUT, EXPLORE, ANALYSIS } from './operationType';
import deleteImage from '@/assets/images/delete-edge.svg';
import gridBg from '@/assets/images/net.png';
import './style.less';

const EXPAND_ERROR = [
  { ErrorCode: 'EngineServer.ErrInternalErr', intl: 'searchGraph.ErrInternalErr' },
  { ErrorCode: 'EngineServer.ErrConfigStatusErr', intl: 'searchGraph.ErrConfigStatusErr' },
  { ErrorCode: 'EngineServer.ErrVClassErr', intl: 'searchGraph.ErrVClassErr' },
  { ErrorCode: 'EngineServer.ErrOrientDBErr', intl: 'searchGraph.ErrOrientDBErr' }
];
class G6Graph extends Component {
  ref = React.createRef();

  group = ''; // 选中节点组

  state = {
    informationVisible: false, // 进出边选择栏
    inAndOutVisible: false, // 进出边拓展栏
    loadingFull: false, // 加载数据全屏loading
    selectEdge: '', // 选择需要展开的边
    visible: false, // 控制分析弹窗
    anylysisTitle: '',
    inOrOut: 'in', // 进出边
    modalVisible: false, // 一键清除
    tipHidden: false, // 框选删除弹窗
    selectedNodes: [], //框选的点
    configBoxVisible: false, // 设置框框
    isClickTool: false // 点击进出边操作圈
  };

  timer = null;

  componentDidMount() {
    this.props.setG6GraphRef(this);
    this.init();

    window.addEventListener('resize', this.changeGraphSize);
  }

  componentDidUpdate(preProps) {
    if (this.props.selectedNode !== preProps.selectedNode) {
      this.setSelectedStyle();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.changeGraphSize);
  }

  /**
   * @description 初始化图结构
   */
  init = () => {
    const { nodes, edges } = this.props;

    // 给边上添加删除图标
    G6.registerEdge(
      'extra-shape-edge',
      {
        afterDraw(cfg, group) {
          const shape = group.get('children')[0];
          const midPoint = shape.getPoint(0.42);
          group.addShape('image', {
            attrs: {
              x: midPoint.x - 18,
              y: midPoint.y - 18,
              width: 36,
              height: 36,
              img: deleteImage,
              cursor: 'pointer'
            },
            name: 'delete-edge'
          });
        },
        update: undefined
      },
      'line'
    );

    // 图谱实例化
    this.graph = new G6.Graph({
      container: this.ref.current,
      linkCenter: true,
      modes: {
        default: [
          {
            type: 'create-edge',
            shouldBegin: () => this.props.addE // 是否允许添加边
          },
          {
            type: 'drag-canvas'
          },
          {
            type: 'tooltip',
            shouldBegin: e => {
              if (!e.target.cfg.id) {
                return true;
              }
            },
            formatText: model => {
              return model.data.name;
            },
            offset: 20
          },
          {
            type: 'edge-tooltip',
            formatText: model => {
              return model.name;
            },
            offset: 20
          },
          {
            type: 'brush-select',
            brushStyle: {
              fill: 'rgba(18, 110, 227, 0.04)',
              stroke: '#126EE3'
            }
          },
          'zoom-canvas',
          'drag-node',
          'brush-select'
        ]
      },
      layout: {
        type: 'gForce',
        // gpuEnabled: true, // 是否启用GPU
        linkDistance: 300,
        nodeStrength: 2000, // 节点作用力，正数代表节点之间的斥力作用，负数代表节点之间的引力作用（注意与 'force' 相反）
        nodeSize: 40,
        preventOverlap: 40, // 防止节点间碰撞
        gravity: 10, // 中心力大小，指所有节点被吸引到 center 的力。数字越大，布局越紧凑
        minMovement: 0.5, // 当一次迭代的平均移动长度小于该值时停止迭代。数字越小，布局越收敛，所用时间将越长
        maxIteration: 1000, // 最大迭代次数。当迭代次数超过该值，但平均移动长度仍然没有达到 minMovement，也将强制停止迭代
        damping: 0.9, // 阻尼系数，取值范围 [0, 1]。数字越大，速度降低得越慢
        maxSpeed: 1000, // 一次迭代的最大移动长度
        coulombDisScale: 0.005 // 库伦系数，斥力的一个系数，数字越大，节点之间的斥力越大
        // workerEnabled: true, //开启 Web-Worker
        // onTick: () => {}
      },
      defaultNode: {
        type: 'circle',
        size: [40, 40],
        style: {
          stroke: 'red',
          lineWidth: 3,
          fill: 'white',
          cursor: 'pointer'
        },
        labelCfg: {
          position: 'top',
          style: {
            fill: '#000'
          }
        }
      },
      defaultEdge: {
        size: 1,
        color: '#000',
        labelCfg: {
          autoRotate: true,
          refY: 5,
          style: {
            fill: '#000'
          }
        },
        style: {
          endArrow: {
            fill: '#000',
            path: G6.Arrow.triangle(10, 12, 25),
            d: 25
          }
        }
      }
    });

    // 关闭局部渲染，用于解决渲染阴影问题，但是对渲染性能有影响
    this.graph.get('canvas').set('localRefresh', false);
    this.graph.data({ nodes, edges });
    this.graph.render();

    // 框选
    this.graph.on('nodeselectchange', e => {
      const { nodes } = e.selectedItems;

      if (e.select && nodes.length) {
        this.setState(
          {
            tipHidden: true,
            selectedNodes: e.selectedItems.nodes
          },
          () => {
            this.selectedStyle(e.selectedItems.nodes, e.selectedItems.edges);
          }
        );
      }
    });

    // 点击整个画布
    this.graph.on('click', e => {
      // 点击空白区域或者边，关闭操作盘
      if (!e.item || e.item.getModel().source) {
        !e.item && this.props.setSelectedNode('');
        !e.item && this.recoveryStyle(); //恢复高亮

        this.closeAll();

        this.props.setAddE(false);
        this.setState({
          tipHidden: false,
          isClickTool: false
        });
      }
      this.setConfigBoxVisible(false);
    });

    // 鼠标移入边
    this.graph.on('edge:mouseenter', evt => {
      const edge = evt.item;
      const model = edge.getModel();
      model.oriLabel = model.label;
      this.graph.updateItem(edge, {
        type: 'extra-shape-edge'
      });
    });
    // 鼠标移出边
    this.graph.on('edge:mouseleave', evt => {
      const edge = evt.item;
      this.graph.setItemState(edge, 'hover', false);
      this.graph.updateItem(edge, {
        type: 'create-edge'
      });
    });

    // 双击节点组
    this.graph.on('node:dblclick', e => {
      clearTimeout(this.timer); //清除未执行的定时器
      this.expandEdges(e.item.get('model'));
    });

    // 点击节点组
    this.graph.on('node:click', e => {
      clearTimeout(this.timer); //清除未执行的定时器
      this.timer = setTimeout(() => {
        // 固定点击过的节点
        const model = e.item.get('model');

        model.fx = e.x;
        model.fy = e.y;

        const { selectedNode, nodes, edges, selectGraph, addE } = this.props;
        const { informationVisible, inAndOutVisible } = this.state;

        // 选择探索边，不在打开操作栏
        if (addE) {
          this.props.setSelectedNode(e.item.getModel());
          return;
        }
        // 打开进出边选择栏
        if (IN.includes(e.target.cfg.id) || OUT.includes(e.target.cfg.id)) {
          let dir = '';
          if (OUT.includes(e.target.cfg.id)) {
            dir = 'out';
          }

          if (IN.includes(e.target.cfg.id)) {
            dir = 'in';
          }

          // this.closeToolPanel();
          this.setState({
            isClickTool: true
          });
          this.openInformation(dir, false);

          return;
        }

        // 删除节点
        if (DELETE.includes(e.target.cfg.id)) {
          this.deleteNode([model], nodes, edges);

          return;
        }

        // 分析报告
        if (ANALYSIS.includes(e.target.cfg.id)) {
          if (!model.data.analysis) {
            return;
          }

          this.setState({
            visible: true,
            anylysisTitle: selectedNode.data.name
          });

          return;
        }

        // 探索关系
        if (EXPLORE.includes(e.target.cfg.id)) {
          if (!nodes.length) {
            // 暂无实体点进行探索！
            message.error(intl.get('searchGraph.noexpore'));

            return;
          }

          this.closeAll();
          this.props.setAddE(true);
          this.graph.emit('node:click', { item: e.item }); // 开启建边模式后立即触发该点类
          return;
        }

        // 点击打开侧边栏
        this.props.setTabSelect(2);
        this.props.autoOpen && this.props.setSideBarVisible(true);

        if (e.item.getModel().id === selectedNode.id) {
          // 重复点击一个点
          if (!informationVisible && !inAndOutVisible) {
            this.openToolPanel(e);
          }

          return;
        }

        this.closeOpen();

        this.openToolPanel(e);
      }, 300);
    });

    // 点击边
    this.graph.on('edge:click', e => {
      const { selectedNode, setSelectedNode } = this.props;
      if (e.target.cfg.name === 'delete-edge') {
        this.deleteEdge(e.item.getModel());
        return;
      }
      // 点击边侧边栏打开
      this.props.setTabSelect(2);
      this.props.autoOpen && this.props.setSideBarVisible(true);

      if (selectedNode.id === e.item.getModel().id) return;
      setSelectedNode(e.item.getModel());
    });

    // 拖动画布任意元素（包括画布）
    this.graph.on('drag', e => {
      const { selectedNode } = this.props;

      setInfoPosition(selectedNode, this.graph, this.state.inOrOut);
      setInAndOutposition(selectedNode, this.graph, this.state.inOrOut);
    });

    this.graph.on('node:drag', e => {
      // 固定拖拽过的节点
      const model = e.item.get('model');
      model.fx = e.x;
      model.fy = e.y;
    });

    this.graph.on('node:dragend', e => {
      const model = e.item.get('model');
      const { nodes, updateGraphData } = this.props;
      const { index } = this.getNodeAndIndexFromId(nodes, model.id);

      nodes[index].fx = model.fx;
      nodes[index].fy = model.fy;

      // 固定移动过的节点的位置
      updateGraphData({ nodes });
    });

    // 滚轮缩放
    this.graph.on('wheelzoom', e => {
      const { selectedNode } = this.props;

      setInfoPosition(selectedNode, this.graph, this.state.inOrOut);
      setInAndOutposition(selectedNode, this.graph, this.state.inOrOut);
    });

    // 鼠标移入节点组
    this.graph.on('mouseenter', e => {
      hoverIn(e, this.group, this.graph, this.openInformation);
    });

    // 鼠标移出节点组
    this.graph.on('mouseout', e => {
      const { isClickTool } = this.state;
      hoverOut(this.group);
      if (!isClickTool) {
        this.setState({
          informationVisible: false,
          selectEdge: ''
        });
      }
    });

    // 探索关系
    this.graph.on('aftercreateedge', async e => {
      const { nodes, edges, selectGraph, updateGraphData } = this.props;

      const model = e.edge.get('model');

      const data = {
        id: parseInt(selectGraph.kg_id),
        rids: [model.source, model.target]
      };

      setTimeout(() => {
        this.graph.removeItem(model.id);
      }, 0);

      const res = await servicesExplore.exploreRelation(data);

      if (res && res.res) {
        if (!res.res.length) {
          message.error([intl.get('searchGraph.exploreNone')]);

          return;
        }

        const hashMap = new Map();

        edges.forEach((item, index) => {
          hashMap.set(item.id, index);
        });

        const result = handleEXData(nodes, edges, hashMap, res.res);

        this.addNodes(nodes, result);

        updateGraphData({ nodes, edges: result }, this.setSelectedStyle);
      }
    });
  };

  /**
   * @description 关闭操作盘
   */
  closeToolPanel = () => {
    if (this.group && this.group.findById('path1')) {
      const arr = DELETE.concat(IN).concat(OUT).concat(EXPLORE).concat(ANALYSIS);
      arr.forEach(item => {
        this.group.removeChild(this.group.findById(item));
      });
    }
  };

  /**
   * @description 关闭所有弹层
   */
  closeAll = () => {
    // this.props.setSelectedNode('');

    this.setState({
      informationVisible: false,
      inAndOutVisible: false,
      selectEdge: ''
    });

    this.closeToolPanel();
  };

  /**
   * @description 探索完边后关闭弹层
   */
  closeOpen = () => {
    this.setState({
      informationVisible: false,
      inAndOutVisible: false,
      selectEdge: ''
    });

    this.closeToolPanel();
  };

  /**
   * @description 打开操作盘
   */
  openToolPanel = e => {
    this.props.setSelectedNode(e.item.getModel());

    this.group = e.item.getContainer();

    if (this.group.findById('path1')) {
      return;
    }

    addToolPanel(this.group, e.item.getModel().data, this.props.anyDataLang);
  };

  /**
   * @description 添加数据
   */
  addNodes = (nodes, edges) => {
    const { newNodes, newEdges } = this.props.changeLabel(nodes, edges);

    this.graph.changeData({ nodes: newNodes, edges: newEdges });
    this.props.updateGraphData({ nodes: newNodes, edges: newEdges });
    this.graph.refresh();

    setTimeout(() => {
      this.changeGraphSize();
    }, 10);
  };

  /**
   * 认知搜索添加数据
   * @param {array} nodes 节点
   * @param {array} edges 边
   * @param {array} marks 星星标记数据
   */
  addNodesByConfig = (nodes, edges, marks) => {
    this.graph.changeData({ nodes, edges });
    this.graph.refresh();
    nodes.forEach(item => {
      const { id } = item;
      const isDelete = !marks.includes(id);

      drawMark(this.graph, id, isDelete);
    });

    setTimeout(() => {
      this.changeGraphSize();
    }, 0);
  };

  /**
   * @description 缩放图谱
   */
  zoomGraph = type => {
    const { selectedNode } = this.props;

    if (type === 'add') {
      this.graph.zoomTo(this.graph.getZoom() + 0.3, {
        x: this.ref.current.clientWidth / 2,
        y: this.ref.current.clientHeight / 2
      });
    }

    if (type === 'reduce') {
      this.graph.zoomTo(this.graph.getZoom() - 0.3, {
        x: this.ref.current.clientWidth / 2,
        y: this.ref.current.clientHeight / 2
      });
    }

    setInfoPosition(selectedNode, this.graph, this.state.inOrOut);
    setInAndOutposition(selectedNode, this.graph, this.state.inOrOut);
  };

  /**
   * @description 改变图谱大小
   */
  changeGraphSize = () => {
    this.graph.changeSize(this.ref.current.clientWidth, this.ref.current.clientHeight);
  };

  /**
   * @description 定位到所选元素
   */
  moveToSelect = () => {
    const { selectedNode } = this.props;

    if (selectedNode) {
      this.graph.focusItem(selectedNode.id);
    } else {
      this.graph.fitView(20, { onlyOutOfViewPort: true, ratioRule: 'max' });
    }

    setInfoPosition(selectedNode, this.graph, this.state.inOrOut);
    setInAndOutposition(selectedNode, this.graph, this.state.inOrOut);
  };

  /**
   * @description 设置inAndOut模块显示
   */
  setInAndOutVisible = inAndOutVisible => {
    const { selectedNode } = this.props;

    this.setState(
      {
        inAndOutVisible
      },
      () => {
        setInAndOutposition(selectedNode, this.graph, this.state.inOrOut);
      }
    );
  };

  /**
   * @description 选择需要展开的边
   */
  setSelectEdge = selectEdge => {
    this.setState(
      {
        selectEdge,
        informationVisible: false
      },
      () => {
        this.setInAndOutVisible(true);
      }
    );
  };

  /**
   * @description 设置loading状态
   */
  setLoadingFull = loadingFull => {
    this.setState({
      loadingFull
    });
  };

  // 打开进出边的弹窗
  openInformation = (direction, hover = true) => {
    const { isClickTool, inOrOut } = this.state;

    // 悬停操作圈其他模块，并且不是点击打开弹窗
    if (!direction && !isClickTool) {
      this.setState({
        informationVisible: false,
        selectEdge: ''
      });
      return;
    }
    // 点击打开进出弹窗，悬停或点击进出模块切换
    if (!direction || (direction !== inOrOut && isClickTool && hover)) {
      return;
    }

    this.setState(
      {
        inOrOut: direction,
        inAndOutVisible: false,
        informationVisible: true
      },
      () => {
        setInfoPosition(this.props.selectedNode, this.graph, direction);
        this.props.setAddE(false);
      }
    );
  };

  /**
   * 更新节点、边透明度
   * @param {String} id 节点或边id
   * @param {Number} opacity 透明度
   */
  setOpacity = (id, opacity = 1) => {
    this.graph.updateItem(id, {
      style: { opacity },
      labelCfg: { style: { opacity } }
    });
  };

  /**
   * @description 选中样式
   */
  setSelectedStyle = () => {
    const { nodes, edges, selectedNode } = this.props;
    const totalData = [...nodes, ...edges];

    // 没有选中内容, 恢复高亮
    if (!selectedNode) {
      totalData.forEach(({ id }) => this.setOpacity(id, 1));

      return;
    }

    // 选中边
    if (selectedNode.source) {
      const { id, source, target } = selectedNode;
      const ids = [id, source, target];

      totalData.forEach(({ id }) => this.setOpacity(id, ids.includes(id) ? 1 : 0.2));

      return;
    }

    // 选中点
    const ids = getRelationByNode(selectedNode.id, edges);

    totalData.forEach(({ id }) => this.setOpacity(id, ids.includes(id) ? 1 : 0.2));
  };

  // 设置框选后的样式
  selectedStyle = (selectedNodes, selectedEdges) => {
    const { nodes, edges } = this.props;
    const totalData = [...nodes, ...edges];

    selectedNodes.forEach(item => {
      this.graph.setItemState(item._cfg.id, 'selected', false);
    });
    selectedEdges.forEach(item => {
      this.graph.setItemState(item._cfg.id, 'selected', false);
    });

    // 选中点
    let ids = [];
    selectedNodes.forEach(item => {
      const id = getEdgesByNode(item._cfg.id, edges);

      ids = [...ids, ...id];
    });
    ids = Array.from(new Set(ids));
    totalData.forEach(({ id }) => this.setOpacity(id, ids.includes(id) ? 1 : 0.2));
  };

  /**
   * 恢复高亮
   */
  recoveryStyle = () => {
    const { nodes, edges } = this.props;
    const totalData = [...nodes, ...edges];
    totalData.forEach(({ id }) => this.setOpacity(id, 1));
  };
  /**
   * @description 一键清空
   */
  clearAll = () => {
    this.addNodes([], []);

    this.props.setSelectedNode('');

    this.setState({
      informationVisible: false, // 进出边选择栏
      inAndOutVisible: false, // 进出边拓展栏
      loadingFull: false, // 加载数据全屏loading
      selectEdge: ''
    });
  };

  /**
   * @description 对外提供选中接口
   */
  outSideSelect = node => {
    const { selectedNode } = this.props;

    if (node.id === selectedNode.id) {
      return;
    }

    this.props.setSelectedNode(node);

    this.closeOpen();

    this.group = this.graph.findById(node.id).getContainer();

    addToolPanel(this.group, node, this.props.anyDataLang);
  };

  /**
   * @description 根据id获取点
   */
  getNodeAndIndexFromId = (nodes, id) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) {
        return { node: nodes[i], index: i };
      }
    }
  };

  // 删除边
  deleteEdge = deleteItem => {
    const { edges, nodes } = this.props;
    const newEdges = edges.filter(item => {
      return deleteItem.id !== item.id;
    });

    this.addNodes(nodes, newEdges);

    this.props.updateGraphData({ edges: newEdges });
    this.props.setSelectedNode('');
  };

  /**
   * @description 删除节点
   */
  deleteNode = (deleteNode, nodes, edges) => {
    const { selectedNodes } = this.state;
    deleteNode = deleteNode || selectedNodes;

    const deleteIds = deleteNode.map(item => item.id || item?._cfg.id);

    const newNodes = nodes.filter(item => {
      return !deleteIds.includes(item.id);
    });

    const newEdges = edges.filter(item => {
      return !deleteIds.includes(item.source) && !deleteIds.includes(item.target);
    });

    this.closeAll();

    this.addNodes(newNodes, newEdges);

    this.props.setSelectedNode('');

    // 恢复高亮
    const totalData = [...newNodes, ...newEdges];
    totalData.forEach(({ id }) => this.setOpacity(id, 1));
  };

  // 双击展开
  expandEdges = async node => {
    const { selectGraph, count, nodes, edges } = this.props;
    try {
      const res = await servicesExplore.expandEdges({
        id: selectGraph.kg_id,
        class: '',
        io: 'inout', // 双击展开，展开全部方向
        rid: node.id,
        page: 1,
        size: count || 100,
        name: ''
      });

      if (res && res.res) {
        const { newNodes, openEdges } = getExpandHandleData(res.res, node, nodes, edges);
        this.addNodes(newNodes, openEdges);
      }

      //报错
      if (res?.ErrorCode) {
        EXPAND_ERROR.forEach(item => {
          if (item.ErrorCode === res?.ErrorCode) {
            message.error([intl.get(item.intl)]);
          }
        });
      }
    } catch (error) {}
  };

  // 关闭分析报告弹窗
  closeAnalysis = () => {
    this.setState({
      visible: false
    });
  };
  // 控制左边设置弹窗
  setConfigBoxVisible = visible => {
    this.setState({
      configBoxVisible: visible
    });
  };

  render() {
    const {
      informationVisible,
      inAndOutVisible,
      loadingFull,
      selectEdge,
      anylysisTitle,
      visible,
      inOrOut,
      modalVisible,
      tipHidden,
      configBoxVisible
    } = this.state;
    const {
      selectGraph,
      nodes,
      edges,
      updateGraphData,
      G6GraphRef,
      selectedNode,
      setSearchVisible,
      isCognitive,
      count
    } = this.props;

    return (
      <div className="G6-graph-show" ref={this.ref} style={{ backgroundImage: `url(${gridBg})` }}>
        <div className={tipHidden ? 'top-tip-box' : 'hidden'}>
          <IconFont type="icon-lajitong" />
          <span className="text">{intl.get('searchGraph.deleteDes')}</span>
          <span className="line">|</span>
          <span
            className="cancel-text"
            onClick={() => {
              this.recoveryStyle();
              this.setState({
                tipHidden: false
              });
            }}
          >
            {intl.get('datamanagement.cancel')}
          </span>
          <span
            className="ok-text"
            onClick={() => {
              this.setState({
                tipHidden: false
              });
              this.deleteNode(null, nodes, edges);
              message.success(intl.get('memberManage.delSuccess'));
            }}
          >
            {intl.get('datamanagement.ok')}
          </span>
        </div>

        {/* 左边缩放 */}
        <div className="zoom-graph">
          <ZoomTool
            count={count}
            setCount={this.props.setCount}
            zoomGraph={this.zoomGraph}
            moveToSelect={this.moveToSelect}
            visible={configBoxVisible}
            setVisible={this.setConfigBoxVisible}
          />
        </div>

        <div className="bottom-but">
          {/* 认知搜索无底部按钮 */}
          {!isCognitive && (
            <>
              <Button
                className="refresh"
                type="default"
                onClick={() => {
                  this.setState({ modalVisible: true });
                }}
              >
                {/* 重新探索 */}
                {intl.get('searchGraph.reExpore')}
              </Button>
              <Button
                className="continue"
                type="primary"
                onClick={() => {
                  setSearchVisible(true);
                }}
              >
                {/* 继续探索 */}
                {intl.get('searchGraph.continueExplore')}
              </Button>
            </>
          )}
        </div>

        {informationVisible ? (
          <Information
            setInAndOutVisible={this.setInAndOutVisible}
            selectGraph={selectGraph}
            selectedNode={selectedNode}
            selectEdge={selectEdge}
            setSelectEdge={this.setSelectEdge}
            inOrOut={inOrOut}
            nodes={nodes}
            edges={edges}
          />
        ) : null}

        {inAndOutVisible ? (
          <InAndOut
            selectEdge={selectEdge}
            selectGraph={selectGraph}
            selectedNode={selectedNode}
            setLoadingFull={this.setLoadingFull}
            nodes={nodes}
            edges={edges}
            addNodes={this.addNodes}
            updateGraphData={updateGraphData}
            closeOpen={this.closeOpen}
            G6GraphRef={G6GraphRef}
            setSelectedStyle={this.setSelectedStyle}
            openInformation={this.openInformation}
            inOrOut={inOrOut}
          />
        ) : null}

        {loadingFull ? (
          <div className="loading-full">
            <LoadingOutlined className="icon" />
          </div>
        ) : null}

        <AnalysisModal
          visible={visible}
          selectGraph={selectGraph}
          selectedNode={selectedNode}
          onCancel={this.closeAnalysis}
          anylysisTitle={anylysisTitle}
        />

        <ModalDelete
          isVisible={modalVisible}
          onOk={() => {
            this.clearAll();
            setSearchVisible(true);
            this.setState({ modalVisible: false });
          }}
          onCancel={() => {
            this.setState({
              modalVisible: false
            });
          }}
        />
      </div>
    );
  }
}
const mapStateToProps = state => ({
  anyDataLang: state.getIn(['changeAnyDataLang', 'anyDataLang'])
});

export default connect(mapStateToProps)(G6Graph);
