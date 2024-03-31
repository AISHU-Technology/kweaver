import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Menu } from 'antd';

import { GRAPH_LAYOUT, GRAPH_LAYOUT_PATTERN } from '@/enums';
import ExtendEdge from './ExtendedEdge';
import PathExplore from './PathExplore';
import { getSavedSlicedData } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/Sliced/assistant';
import SubGroupMenuItem from '../SubGroupMenuItem';
import { getFakerProps } from '../../utils';
import './style.less';

const CONFIG: any = {
  style: { checked: true },
  fixed: { checked: true },
  invert: { checked: true },
  remove: { checked: true },
  hide: { checked: true },
  selectSame: { checked: true },
  neighbors: { checked: true },
  superNeighbors: { checked: true },
  path: { checked: true },
  subgraph: { checked: true },
  sliced: { checked: true }
};
const NodeMenu = (_props: any) => {
  const isFaker = _props.selectedItem?.faker;
  const props = isFaker ? getFakerProps(_props) : _props;
  const { config = CONFIG, onClickCustom } = props;
  const { selectedNode, selectedItem } = props;
  const {
    onCloseMenu,
    onSetStartNode,
    onChangeGraphMode,
    onSelectSameClass,
    onRemoveItem,
    onHideItem,
    onLockNode,
    onChangeData,
    onOpenLeftDrawer,
    openTip,
    onInvert,
    onOpenDisplayModal,
    onSaveSliced
  } = props;
  const hasLocked = selectedNode?.hasLocked();
  const graphLayoutPattern = selectedItem?.graphLayoutPattern;
  const isTree = selectedItem?.layoutConfig?.key === GRAPH_LAYOUT.TREE;
  const authorKgView = selectedItem?.detail?.authorKgView;
  const isServiceConfig = selectedItem?.componentOrigin === 'AnalysisServiceConfig';
  const isResultSelecting = selectedItem?.resultSelecting; // 正在选择添加搜索结果, 禁止某些修改图数据的操作
  const expandRef = useRef<any>(null);

  const clickWrap =
    (func: Function) =>
    (...arg: any) =>
      !isFaker && func?.(...arg);

  /**
   * 高级展开
   * @param isAdv
   */
  const onClickExpand = (isAdv = false) => {
    expandRef.current = { isShow: true };
    if (selectedItem?.selected?.nodes?.length >= 2 || isAdv) {
      onOpenLeftDrawer('neighbors');
      onCloseMenu();
    }
  };

  const hideIcon = () => {
    return selectedItem?.selected?.nodes?.length >= 2 && !isServiceConfig;
  };

  /**
   * 打开保存切片弹窗
   */
  const handleSaveSliced = () => {
    const nodes = [...(selectedItem?.selected?.nodes || [])];
    const edges = [...(selectedItem?.selected?.edges || [])];
    nodes.push(selectedNode);
    const data = getSavedSlicedData({ nodes, edges }, selectedItem.graph.current.__getSubGroups());
    onSaveSliced?.(data);
  };

  const [menus, setMenus] = useState<any>([]);
  useEffect(() => {
    const MENU_LIST = [
      {
        id: 'style', // 外观样式
        title: intl.get('exploreGraph.appearance'),
        component: (title: string) => (
          <Menu.Item
            key="style"
            disabled={!isFaker && isResultSelecting}
            onClick={clickWrap(() => {
              const model = selectedNode?.getModel();
              if (!model) return;
              const updateData = _.cloneDeep(model?._sourceData);
              delete updateData.type;
              onOpenDisplayModal(updateData);
            })}
          >
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'neighbors', // 邻居查询
        title: intl.get('exploreGraph.neighbor'),
        component: (title: string) =>
          isFaker ? (
            <Menu.Item key="neighbors">{title}</Menu.Item>
          ) : (
            <Menu.SubMenu
              key="neighbors"
              popupClassName="graphMenuSub"
              disabled={!isFaker && (!authorKgView || isResultSelecting)}
              title={<span>{title}</span>}
              onTitleClick={clickWrap(() => onClickExpand())}
              className={hideIcon() ? 'modeIcon' : ''}
            >
              <ExtendEdge
                extend={expandRef}
                isTree={isTree}
                selectedNode={selectedNode}
                selectedItem={selectedItem}
                openTip={openTip}
                onCloseMenu={onCloseMenu}
                onChangeData={onChangeData}
                onClickExpand={onClickExpand}
              />
            </Menu.SubMenu>
          )
      },
      {
        id: 'path', // 路径查询
        title: intl.get('exploreGraph.pathQuery'),
        deps: [GRAPH_LAYOUT_PATTERN.COMMON],
        component: (title: string) =>
          isFaker ? (
            <Menu.Item key="path">{title}</Menu.Item>
          ) : (
            <Menu.SubMenu
              key="path"
              popupClassName="graphMenuSub"
              disabled={!isFaker && (!authorKgView || isTree || isResultSelecting)}
              title={<span>{title}</span>}
            >
              <PathExplore
                onCloseMenu={onCloseMenu}
                onSetStartNode={onSetStartNode}
                onChangeGraphMode={onChangeGraphMode}
                onOpenLeftDrawer={onOpenLeftDrawer}
              />
            </Menu.SubMenu>
          )
      },
      {
        id: 'fixed', // 固定当前位置
        title: intl.get(`exploreGraph.${hasLocked ? 'unfixed' : 'fixed'}`),
        deps: [GRAPH_LAYOUT_PATTERN.COMMON],
        component: (title: string) => (
          <Menu.Item key="fixed" onClick={onLockNode} disabled={!isFaker && (isTree || isResultSelecting)}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'invert', // 反选
        title: intl.get('exploreGraph.invert'),
        component: (title: string = intl.get('exploreGraph.invert')) => (
          <Menu.Item key="invert" disabled={!isFaker && isResultSelecting} onClick={onInvert}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'remove', // 移除
        title: intl.get('exploreGraph.remove'),
        component: (title: string) => (
          <Menu.Item key="remove" disabled={!isFaker && isResultSelecting} onClick={onRemoveItem}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'hide', // 隐藏
        title: intl.get('exploreGraph.hide'),
        component: (title: string) => (
          <Menu.Item key="hide" disabled={!isFaker && isResultSelecting} onClick={onHideItem}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'selectSame', // 选中相同类
        title: intl.get('exploreGraph.selectSame'),
        component: (title: string = intl.get('exploreGraph.selectSame')) => (
          <Menu.Item key="selectSame" disabled={!isFaker && isResultSelecting} onClick={onSelectSameClass}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'subgraph', // 选中子图
        title: intl.get('exploreGraph.selectSubgraphAndPath'),
        deps: [GRAPH_LAYOUT_PATTERN.COMMON],
        component: (title: string) => (
          <SubGroupMenuItem
            title={title}
            selectedNode={selectedNode}
            selectedItem={selectedItem}
            onCloseMenu={onCloseMenu}
          />
        )
      },
      {
        id: 'sliced', // 图切片
        title: intl.get('exploreGraph.sliceTitle'),
        deps: [GRAPH_LAYOUT_PATTERN.COMMON],
        component: (title: string) =>
          isFaker ? (
            <Menu.Item key="sliced">{title}</Menu.Item>
          ) : (
            <Menu.SubMenu key="sliced" popupClassName="graphMenuSub" title={<span>{title}</span>}>
              <Menu.Item key="save" className="sliced-sub-menu-item" onClick={handleSaveSliced}>
                {intl.get('exploreGraph.sliceSave')}
              </Menu.Item>
              <Menu.Item key="list" className="sliced-sub-menu-item" onClick={() => onOpenLeftDrawer?.('sliced')}>
                {intl.get('exploreGraph.sliceList')}
              </Menu.Item>
            </Menu.SubMenu>
          )
      }
    ];
    const customOptions = _.filter(config, item => {
      const nodeClass = selectedNode?._cfg?.model?._sourceData?.class;
      return nodeClass === item.class && item.type === 'custom';
    });
    _.forEach(customOptions, item => {
      MENU_LIST.push({
        id: item.key,
        title: item.alias,
        component: (title: string) => (
          <Menu.Item key={item.key} disabled={!isFaker && isResultSelecting} onClick={() => onClickCustom(item)}>
            {title}
          </Menu.Item>
        )
      });
    });
    const visiblyMenus = _.filter(MENU_LIST, menu => {
      if (menu.deps && graphLayoutPattern && !_.includes(menu.deps, graphLayoutPattern)) return;
      return config[menu.id] && config[menu.id]?.checked;
    });
    setMenus(visiblyMenus);
    if (_.isEmpty(visiblyMenus)) {
      selectedItem?.graph?.current?.__onSetMenuConfig(null);
    }
  }, [JSON.stringify(config)]);

  if (_.isEmpty(menus)) return null;

  return (
    <div className="nodeMenuRoot">
      <Menu className="graphMenu" mode="vertical" triggerSubMenuAction="click">
        {_.map(menus, item => {
          const { id, component } = item;
          // if (!config[id] || !config[id]?.checked) return null;
          const title = config[id]?.alias || item.title;
          return <React.Fragment key={id}>{component(title)}</React.Fragment>;
        })}
      </Menu>
    </div>
  );
};
export default NodeMenu;
