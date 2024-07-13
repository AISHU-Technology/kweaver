/* eslint-disable max-lines */
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import moment from 'moment';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Modal, Button, Divider, Tooltip, Popover } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';

import { GRAPH_CONFIG, GRAPH_LAYOUT, GRAPH_LAYOUT_PATTERN } from '@/enums';
import { getParam } from '@/utils/handleFunction';
import servicesPermission from '@/services/rbacPermission';

import { tipModalFunc } from '@/components/TipModal';
import IconFont from '@/components/IconFont';
import registerLegend from '../../GraphG6/utils/registerLegend';
import ModelSetting from './ModelSetting';
import ModelSnapshots from './ModelSnapshoots';
import Simple from '../../LeftSpace/Simple';
import SlicedBar from './SlicedBar';
import { getFakerProps } from '../../GraphG6/utils';

import './style.less';

const convertToPercentage = (rate: number) => {
  let percentage = Number(rate.toFixed(2)) * 100;
  if (percentage > 398) percentage = 400;
  return `${percentage.toFixed(0)}%`;
};

const BUTTON_STYLE = { height: 34, lineHeight: '34px', padding: 0, minWidth: 0 };
const HeaderOperation = (_props: any) => {
  const isFaker = _props.selectedItem?.faker;
  const iframe = window.location.pathname.includes('iframe') || window.location.pathname.includes('test');
  const history = useHistory();
  const props = isFaker ? getFakerProps(_props) : _props;
  const { configSearch = {}, configOperate } = props;
  const { selectedItem, onOpenLeftDrawer, onChangeData, onOpenRightDrawer, onCloseRightDrawer, onOpenSaveModal } =
    props;
  const { graph, graphLayoutPattern } = selectedItem;
  const zoom = selectedItem?.zoom || 1;
  const hasSelected = selectedItem?.selected?.length;
  const hasSource = selectedItem?.graph?.current?.getNodes()?.length;
  const isFetching = selectedItem?.exploring?.isExploring || selectedItem?.isLoading;
  const hasUndoStack = selectedItem?.stack?.undoStack?.length;
  const hasRedoStack = selectedItem?.stack?.redoStack?.length;
  const hasGraphData = selectedItem?.graphData?.nodes?.length;
  const hasHided = selectedItem?.apis?.hasHided();
  const backColor = GRAPH_CONFIG.BACKGROUND_COLOR?.[selectedItem?.graphConfig?.color];
  const isResultSelecting = selectedItem?.resultSelecting; // 正在选择添加搜索结果, 禁止某些修改图数据的操作
  const isLayoutTree = selectedItem?.layoutConfig?.key === GRAPH_LAYOUT.TREE;

  useEffect(() => {
    window.addEventListener('keydown', keyDownListener);
    return () => window.removeEventListener('keydown', keyDownListener);
  }, [hasUndoStack, hasRedoStack]);

  /** 有数据添加时，修改 graphData */
  const onChangeGraphData_Add = () => {
    const graphData = selectedItem?.graphData;
    const oldNodesKV = _.keyBy(graphData?.nodes, 'id');
    const oldEdgesKV = _.keyBy(graphData?.edges, 'id');
    _.forEach(graph.current.getNodes(), item => {
      const { x, y, id, size, isAgencyNode, _sourceData } = item.getModel();
      if (isAgencyNode) return;
      oldNodesKV[id] = { x, y, size, ..._sourceData };
    });
    _.forEach(graph.current.getEdges(), d => {
      const { id, _sourceData } = d.getModel();
      if (!id) return;
      if (!_sourceData) return;
      if (oldEdgesKV[id]) {
        oldEdgesKV[id] = { ...oldEdgesKV[id], ..._sourceData };
      } else {
        oldEdgesKV[id] = _sourceData;
      }
    });

    const nodes = _.values(oldNodesKV);
    const edges = _.values(oldEdgesKV);
    graph.current.__canvasRefresh = false;
    registerLegend.updateLegend(graph);
    onChangeData({ type: 'selected', data: {} });
    onChangeData({ type: 'graphData', data: { nodes, edges } });
  };

  /** 有数据删除时，修改 graphData */
  const onChangeGraphData_Delete = ({ nodes, edges }: any) => {
    const graphData = selectedItem?.graphData;
    const oldNodesKV = _.keyBy(nodes, 'id');
    const oldEdgesKV = _.keyBy(edges, 'id');

    _.forEach(graphData?.nodes || [], item => {
      if (oldNodesKV?.[item?.id]) item.isDelete = true;
    });
    _.forEach(graphData?.edges || [], item => {
      if (oldEdgesKV?.[item?.id]) item.isDelete = true;
    });
    const newNodes = _.filter(graphData?.nodes || [], item => {
      const isDelete = item.isDelete;
      delete item.isDelete;
      return !isDelete;
    });
    const newEdges = _.filter(graphData?.edges || [], item => {
      const isDelete = item.isDelete;
      delete item.isDelete;
      return !isDelete;
    });

    onChangeData({ type: 'selected', data: {} });
    onChangeData({ type: 'graphData', data: { nodes: newNodes, edges: newEdges } });
  };

  const recoverStyle = (data: any) => {
    const newGraphData = _.cloneDeep(selectedItem?.graphData);
    const nodesKV = _.keyBy(data?.nodes, '_sourceData.id') || {};
    const edgesKV = _.keyBy(data?.edges, '_sourceData.id') || {};
    newGraphData.nodes = _.map(newGraphData.nodes, item => {
      let _item = item;
      if (nodesKV[item.id]) _item = { ...item, ...nodesKV[item.id]?._sourceData };
      return _item;
    });
    newGraphData.edges = _.map(newGraphData.edges, item => {
      let _item = item;
      if (edgesKV[item.id]) _item = { ...item, ...edgesKV[item.id]?._sourceData };
      return _item;
    });
    graph.current.__canvasRefresh = false;
    onChangeData({ type: 'graphData', data: newGraphData });
  };

  const onUndo = () => {
    graph.current.graphStack.onUndo(({ type, data }: any) => {
      if (type === 'add' && data) onChangeGraphData_Delete(data);
      if (type === 'delete') onChangeGraphData_Add();
      if (type === 'visible') {
        // graph.current.__canvasRefresh = false;
        onChangeData({ type: 'graphData', data });
      }
      if (type === 'update') recoverStyle(data);
    });
  };

  const onRedo = () => {
    graph.current.graphStack.onRedo(({ type, data }: any) => {
      if (type === 'add') onChangeGraphData_Add();
      if (type === 'delete' && data) onChangeGraphData_Delete(data);
      if (type === 'visible') {
        // graph.current.__canvasRefresh = false;
        onChangeData({ type: 'graphData', data });
      }
      if (type === 'update') recoverStyle(data);
    });
  };

  // 移除选中
  const onClearSelected = async () => {
    const nodes = graph.current.findAllByState('node', 'selected');
    const edges = graph.current.findAllByState('edge', 'selected');
    const length = nodes?.length + edges?.length;
    onChangeData({ type: 'delete', data: { nodes, edges, length, tabKey: selectedItem.key } });
    if (graph.current.getNodes()?.length === nodes?.length) {
      graph.current.__canvasRefresh = false;
    }
  };

  // 移除全部
  const onClearAll = async () => {
    if (hasHided) {
      const isOk = await tipModalFunc({
        iconChange: true,
        title: intl.get('global.tip'),
        content: intl.get('exploreGraph.hideTip')
      });
      if (!isOk) return;
    }
    const nodes = graph.current.getNodes();
    const edges = graph.current.getEdges();
    onChangeData({ type: 'delete', data: { nodes, edges, length: nodes.length + edges.length } });
    graph.current.__canvasRefresh = false;
    registerLegend.updateLegend(graph);
    onChangeData({ type: 'graphData', data: { nodes: [], edges: [] } });
  };

  // 移除其他
  const onClearInvert = async () => {
    const nodes: any = [];
    const edges: any = [];
    let isExistHided = false;
    _.forEach(graph.current.getEdges() || [], item => {
      const states = item?._cfg?.states;
      if (!_.includes(states, 'selected')) edges.push(item);
      if (!item?.get('visible')) isExistHided = true;
    });
    _.forEach(graph.current.getNodes() || [], item => {
      const states = item?._cfg?.states;
      if (!_.includes(states, 'selected')) nodes.push(item);
      if (!item?.get('visible')) isExistHided = true;
    });
    if (isExistHided) {
      const isOk = await tipModalFunc({
        iconChange: true,
        title: intl.get('global.tip'),
        content: intl.get('exploreGraph.hideTip')
      });
      if (!isOk) return;
    }
    onChangeData({ type: 'delete', data: { nodes, edges, length: nodes.length + edges.length } });
  };

  // 隐藏实体
  const onHide = () => {
    const graphData = selectedItem.apis.getGraphData({ filter: 'all' });
    const hidedNodeMap = _.keyBy(selectedItem.selected?.nodes, n => n?._cfg?.id);
    const hidedEdgeMap = _.keyBy(selectedItem.selected?.edges, e => e?._cfg?.id);
    const newNodes = _.map(graphData.nodes, d => {
      let hide = d.hide;
      if (hidedNodeMap[d.id]) {
        hide = true;
      }
      return { ...d, hide };
    });
    const newEdges = _.map(graphData.edges, d => {
      let hide = d.hide;
      if (hidedEdgeMap[d.id] || _.some(d.relation, id => hidedNodeMap[id])) {
        hidedEdgeMap[d.id] = true;
        hide = true;
      }
      return { ...d, hide };
    });
    _.forEach(graph.current.getNodes(), shape => {
      hidedNodeMap[shape?._cfg?.id] && shape?.hide();
    });
    _.forEach(graph.current.getEdges(), shape => {
      hidedEdgeMap[shape?._cfg?.id] && shape?.hide();
    });
    selectedItem?.graph?.current?.graphStack.pushStack('visible', {
      before: { ...graphData },
      after: { nodes: newNodes, edges: newEdges }
    });
    // graph.current.__canvasRefresh = false;
    onChangeData({ type: 'selected', data: { nodes: [], edges: [] } });
    onChangeData({ type: 'graphData', data: { nodes: newNodes, edges: newEdges } });
    selectedItem?.graph?.current?.__removeSubGroups();
  };

  // 显示隐藏的实体
  const onShow = async () => {
    const isOk = await tipModalFunc({
      iconChange: true,
      title: intl.get('global.tip'),
      content: intl.get('exploreGraph.unhideTip')
    });
    if (!isOk) return;
    const graphData = selectedItem.apis.getGraphData({ filter: 'all' });
    const newNodes = _.map(graphData.nodes, d => ({ ...d, hide: false }));
    const newEdges = _.map(graphData.edges, d => ({ ...d, hide: false }));
    _.forEach(graph.current.getNodes(), shape => shape?.show());
    _.forEach(graph.current.getEdges(), shape => shape?.show());
    selectedItem?.graph?.current?.graphStack.pushStack('visible', {
      before: { ...graphData },
      after: { nodes: newNodes, edges: newEdges }
    });
    // graph.current.__canvasRefresh = false;
    onChangeData({ type: 'graphData', data: { nodes: newNodes, edges: newEdges } });
  };

  const onChangeZoom = (type: string) => {
    if (type === '100') {
      graph.current.zoomTo(1);
      graph.current.fitCenter();
      graph.current.__getLayerFromZoom(zoom * 100, 100);
      onChangeData({ type: 'zoom', data: 1 });
    }
    if (type === '-') {
      const toRatio = Math.max(zoom - 0.05, 0.05);
      graph.current.zoomTo(toRatio);
      graph.current.fitCenter();
      graph.current.__getLayerFromZoom(zoom * 100, toRatio * 100);
      onChangeData({ type: 'zoom', data: toRatio });
    }
    if (type === '+') {
      const toRatio = Math.min(zoom + 0.05, 4);
      graph.current.zoomTo(toRatio);
      graph.current.fitCenter();
      graph.current.__getLayerFromZoom(zoom * 100, toRatio * 100);
      onChangeData({ type: 'zoom', data: toRatio });
    }
  };

  /**
   * 监听 ctrl + y/z 重做、撤销
   */
  const keyDownListener = (e: any) => {
    const { ctrlKey, key, keyCode } = e;

    // 侧边sql输入
    if (e?.target?.className === 'cm-content') {
      return;
    }

    if (ctrlKey && (keyCode === 89 || key?.toLowerCase() === 'Y')) {
      if (!hasRedoStack) return;
      onRedo();
    }

    if (ctrlKey && (keyCode === 90 || key?.toLowerCase() === 'Z')) {
      if (!hasUndoStack) return;
      onUndo();
    }
  };

  // 气泡卡片相关的操作
  const [popoverKey, setPopoverKey] = useState('');
  const onOpenPopover = (key: string) => setPopoverKey(key);
  const onClosePopover = () => setPopoverKey('');
  useEffect(() => {
    const onCHangePopover = () => {
      if (popoverKey) setPopoverKey('');
    };
    document.addEventListener('click', onCHangePopover);
    return () => document.removeEventListener('click', onCHangePopover);
  }, [popoverKey]);

  // 搜索工具的逻辑
  const onClickMenu = (id: any) => {
    onCloseRightDrawer();
    onOpenLeftDrawer(id);
  };
  const onChangeConfig = (data: any) => {
    onChangeData({
      type: 'customRightClick',
      data: { visible: true, data }
    });
  };
  const getSearchComponent = () => {
    if (_.isEmpty(_.filter(configSearch, item => item.checked))) {
      return {};
    }

    return {
      component: (
        <Simple
          config={configSearch}
          onChangeConfig={onChangeConfig}
          selectedItem={selectedItem}
          onClickMenu={onClickMenu}
        />
      )
    };
  };

  let operates: any[][] = [
    [
      getSearchComponent(),
      {
        // 快捷键-搜索
        id: 'simpleSearch',
        tip: isLayoutTree ? intl.get('exploreGraph.searchTree') : intl.get('exploreGraph.search'),
        icon: 'icon-searchvid',
        disabled: isFetching,
        deps: [GRAPH_LAYOUT_PATTERN.COMMON],
        onClick: () => onOpenLeftDrawer('search')
      },
      {
        // 快捷键-图语言查询
        id: 'simpleSql',
        tip: intl.get('exploreGraph.sqlQuery'),
        icon: 'icon-daima',
        disabled: isFetching || isLayoutTree,
        deps: [GRAPH_LAYOUT_PATTERN.COMMON],
        onClick: () => onOpenLeftDrawer('sql')
      },
      {
        // 快捷键-邻居查询
        id: 'simpleNeighbors',
        tip: intl.get('exploreGraph.neighbor'),
        icon: 'icon-huaxiangfenxi',
        disabled: isFetching,
        onClick: () => onOpenLeftDrawer('neighbors')
      },
      // 树图时禁用邻居查询
      {
        // 快捷键-路径查询
        id: 'simplePath',
        tip: intl.get('exploreGraph.pathQuery'),
        icon: 'icon-guiji',
        disabled: isFetching || isLayoutTree,
        deps: [GRAPH_LAYOUT_PATTERN.COMMON],
        onClick: () => onOpenLeftDrawer('path')
      },
      {
        // 图计算
        id: 'algorithm',
        tip: intl.get('exploreGraph.algorithm.graphAlgorithmLower'),
        icon: 'icon-tujisuan',
        disabled: isFetching || _.isEmpty(selectedItem?.graph?.current?.getNodes()) || isResultSelecting,
        deps: [GRAPH_LAYOUT_PATTERN.COMMON],
        onClick: () => {
          _props?.onOpenLeftDrawer('algorithm');
        }
      },
      {
        // 图切片
        id: 'sliced',
        deps: [GRAPH_LAYOUT_PATTERN.COMMON],
        component: (
          <SlicedBar
            title={configOperate?.sliced?.alias}
            selectedItem={selectedItem}
            disabled={
              isFetching ||
              (!selectedItem?.sliced?.length && _.isEmpty(selectedItem?.graph?.current?.getNodes())) ||
              isResultSelecting
            }
            onOpenLeftDrawer={onOpenLeftDrawer}
            onChangeData={onChangeData}
          />
        )
      },
      { type: 'divider' },
      {
        // 回退
        id: 'undo',
        tip: intl.get('exploreGraph.revocation'),
        icon: 'icon-houtui',
        disabled: isFetching || !hasUndoStack || isResultSelecting,
        onClick: onUndo
      },
      {
        // 重做
        id: 'redo',
        tip: intl.get('exploreGraph.redo'),
        icon: 'icon-qianjin',
        disabled: isFetching || !hasRedoStack || isResultSelecting,
        onClick: onRedo
      },
      {
        // 删除选中的元素
        id: 'removeSelected',
        tip: intl.get('exploreGraph.removeSelected'),
        icon: 'icon-yichuxuanzhongxiang',
        disabled: isFetching || !hasSource || isResultSelecting,
        onClick: onClearSelected
      },
      {
        // 移除全部
        id: 'removeAll',
        tip: intl.get('exploreGraph.removeAll'),
        icon: 'icon-quanbuyichu',
        disabled: isFetching || !hasSource || isResultSelecting,
        onClick: onClearAll
      },
      {
        // 移除其他
        id: 'removeOther',
        tip: intl.get('exploreGraph.removeOthers'),
        icon: 'icon-yichuqita',
        disabled: isFetching || !hasSelected || hasSelected === hasGraphData || isResultSelecting,
        onClick: onClearInvert
      },
      {
        // 隐藏
        id: 'hide',
        tip: intl.get('exploreGraph.hide'),
        icon: 'icon-bukejian',
        disabled: isFetching || !hasSelected || isResultSelecting,
        onClick: onHide
      },
      {
        // 取消隐藏
        id: 'show',
        tip: intl.get('exploreGraph.unhide'),
        icon: 'icon-kejian1',
        disabled: isFetching || !hasHided || isResultSelecting,
        onClick: onShow
      },
      { type: 'divider' },
      {
        // 样式
        id: 'styleSetting',
        tip: intl.get('exploreGraph.displaySetting'),
        icon: 'icon-yangshi',
        disabled: isFetching || _.isEmpty(selectedItem?.graph?.current?.getNodes()) || isResultSelecting,
        onClick: () => onOpenLeftDrawer('display')
      },
      {
        // 布局
        id: 'layout',
        tip: intl.get('exploreGraph.layout.layout'),
        icon: 'icon-buju1',
        disabled: isFetching || _.isEmpty(selectedItem?.graph?.current?.getNodes()) || isResultSelecting,
        onClick: () => onOpenLeftDrawer('layout')
      }
    ],
    [
      {
        // 缩小
        id: 'zoom',
        tip: intl.get('exploreGraph.zoomIn'),
        icon: <MinusOutlined className="kw-mr-2 kw-ml-2 kw-pointer" style={{ fontSize: 18 }} />,
        disabled: isFetching || Number(zoom.toFixed(2)) <= 0.05,
        onClick: () => onChangeZoom('-')
      },
      {
        // 重置缩放
        id: 'zoom',
        tip: intl.get('exploreGraph.resetZoom'),
        text: convertToPercentage(zoom),
        disabled: isFetching,
        onClick: () => onChangeZoom('100')
      },
      {
        // 放大
        id: 'zoom',
        tip: intl.get('exploreGraph.zoomOut'),
        icon: <PlusOutlined className="kw-mr-2 kw-ml-2 kw-pointer" style={{ fontSize: 18 }} />,
        disabled: isFetching || Number(zoom.toFixed(2)) >= 3.9,
        onClick: () => onChangeZoom('+')
      },
      { type: 'divider' },
      {
        // 定位
        id: 'locate',
        tip: intl.get('exploreGraph.locate'),
        icon: 'icon-dingwei1',
        disabled: isFetching,
        onClick: () => {
          const nodes = selectedItem?.selected?.nodes;
          const edges = selectedItem?.selected?.edges;
          if (nodes?.length === 1) {
            graph.current.focusItem(nodes[0]);
          } else if (edges?.length === 1) {
            graph.current.focusItem(edges[0]);
          } else {
            graph.current.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
          }
          onCloseRightDrawer();
          const zoom = graph.current.getZoom();
          onChangeData({ type: 'zoom', data: zoom });
        }
      },
      {
        // 自适应
        id: 'fitView',
        tip: intl.get('exploreGraph.adaptation'),
        icon: 'icon-fenxi',
        disabled: isFetching,
        onClick: () => {
          graph.current.fitView(0);
          onCloseRightDrawer();
          const zoom = graph.current.getZoom();
          onChangeData({ type: 'zoom', data: zoom });
        }
      },
      {
        // 视图剧中
        id: 'fitCenter',
        tip: intl.get('exploreGraph.viewCenter'),
        icon: 'icon-mubiao',
        disabled: isFetching,
        onClick: () => {
          graph.current.fitView(0, { onlyOutOfViewPort: true, direction: 'x' });
          onCloseRightDrawer();
          const zoom = graph.current.getZoom();
          onChangeData({ type: 'zoom', data: zoom });
        }
      }
    ],
    [
      {
        // 统计
        id: 'statistics',
        tip: intl.get('exploreGraph.statistics'),
        icon: 'icon-shujutongji1',
        disabled: isFetching,
        onClick: () => onOpenRightDrawer('summary')
      },
      {
        // 画布设置
        id: 'canvasSetting',
        tip: intl.get('exploreGraph.setting'),
        icon: 'icon-setting',
        disabled: isFetching || isResultSelecting,
        popover: <ModelSetting graphConfig={selectedItem.graphConfig} onChangeData={onChangeData} />
      },
      {
        // 保存图片
        id: 'downloadImage',
        tip: intl.get('exploreGraph.screenshot'),
        icon: 'icon-jietu',
        disabled: isFetching || isResultSelecting,
        onClick: () => {
          const imageName = moment().format('YYYY-MM-DD-hhmmss');
          graph.current.downloadImage(imageName, 'image/png', backColor);
        }
      },
      {
        // 保存
        id: 'save',
        tip: iframe || isFaker ? intl.get('exploreGraph.snapshots.snapshot') : intl.get('exploreGraph.saveTwo'),
        icon: 'icon-baocun',
        disabled: isFetching || isResultSelecting,
        popover: iframe ? (
          <ModelSnapshots
            isVisible={popoverKey === 'save'}
            selectedItem={selectedItem}
            onChangeData={onChangeData}
            onOpenLeftDrawer={onOpenLeftDrawer}
            onClosePopover={onClosePopover}
          />
        ) : null,
        onClick: async () => {
          if (iframe) return;
          // DATA-354277 dataPermission 入参dataIds kg_conf_id -> id
          // const result = await servicesPermission.dataPermission(postData);
          // const codes = result?.res?.[0]?.codes || [];
          // if (!_.includes(codes, PERMISSION_KEYS.KG_VIEW)) {
          //   Modal.warning({
          //     title: intl.get('exploreAnalysis.notHaveKGAuthor'),
          //     onOk: () => history.goBack()
          //   });
          //   return;
          // }
          onOpenSaveModal({ targetKey: selectedItem?.key, isSkipPopup: true });
        }
      }
    ]
  ];

  operates = _.map(operates, item => {
    const newItem = _.filter(item, (d: any) => {
      if (isFaker && d.id !== 'algorithm') d.onClick = () => 0;

      const boolId = ['hide', 'show'].includes(d.id) ? 'hide&show' : d.id;
      return !!configOperate[boolId] || d?.type === 'divider' || d.component;
    });
    return newItem;
  });

  return (
    <div className="headerOperationRoot">
      {_.map(operates, (_items: any, i) => {
        const items = _.filter(_items, d => {
          if (d.deps && graphLayoutPattern && !_.includes(d.deps, graphLayoutPattern)) return false;
          // 隐藏和显示的配置是绑定的
          const boolId = ['hide', 'show'].includes(d.id) ? 'hide&show' : d.id;
          if (!d?.id && d?.component) return true;
          return d?.type === 'divider' || (configOperate[boolId] && configOperate[boolId]?.checked);
        });

        // 去除头尾分割线
        if (items[0]?.type === 'divider') items.shift();
        if (items[items.length - 1]?.type === 'divider') items.pop();

        return (
          <div key={i} className="kw-align-center" style={{ marginRight: i === 1 ? '17%' : 0 }}>
            {_.map(items, (item: any, index: number) => {
              if (item === null) return null;
              if (item?.type === 'divider' && index !== 0 && index !== items.length - 1) {
                return <Divider key={index} className="kw-mr-2" type="vertical" style={{ height: 20 }} />;
              }

              if (item?.component) return <React.Fragment key={index}>{item.component}</React.Fragment>;
              const { id, icon = '', text = '', hasDivider = false, disabled = false, onClick = () => {} } = item;
              let tip = configOperate[item.id]?.alias || item.tip;
              if (['hide', 'show'].includes(item.id) && configOperate['hide&show']?.alias) {
                const aliasArray = _.split(configOperate['hide&show']?.alias, '/');
                tip = aliasArray[item.id === 'hide' ? 0 : 1] || item.tip;
              }
              const placement = i === operates.length - 1 && index === items.length - 1 ? 'topRight' : 'top';
              const iconFont = <IconFont type={icon} className="kw-mr-2 kw-ml-2 kw-pointer" style={{ fontSize: 18 }} />;
              const iconSpan = typeof icon === 'string' ? iconFont : icon;
              const textSpan = (
                <span className="selectNone" style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
                  {text}
                </span>
              );

              const element = (
                <React.Fragment>
                  {hasDivider && <Divider key={index} className="kw-mr-2" type="vertical" style={{ height: 20 }} />}
                  <Tooltip title={tip} placement={placement}>
                    <Button
                      type="link"
                      className={`${disabled ? '' : 'colorChange'}`}
                      style={{ ...BUTTON_STYLE, ...(disabled ? {} : { color: '#000' }) }}
                      disabled={disabled}
                      onClick={() => {
                        if (item.popover && !isFaker) onOpenPopover(id);
                        onClick();
                      }}
                    >
                      {!!icon && iconSpan}
                      {!!text && textSpan}
                    </Button>
                  </Tooltip>
                </React.Fragment>
              );

              if (!item.popover) return <React.Fragment key={`${tip}-${index}`}>{element}</React.Fragment>;
              return (
                <Popover
                  open={popoverKey === id}
                  key={`${tip}-${index}`}
                  overlayClassName="graphHeaderOperationItem"
                  trigger="click"
                  placement="bottomRight"
                  content={item.popover}
                  getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
                  onOpenChange={(visible: boolean) => {
                    if (visible) onCloseRightDrawer();
                  }}
                >
                  {element}
                </Popover>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default HeaderOperation;
