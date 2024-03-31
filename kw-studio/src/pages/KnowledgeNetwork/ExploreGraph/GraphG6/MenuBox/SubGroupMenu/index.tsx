import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Menu } from 'antd';

import { GRAPH_LAYOUT_PATTERN } from '@/enums';
import { getFakerProps } from '../../utils';
import './style.less';

const CONFIG: any = {
  remove: { checked: true },
  hide: { checked: true },
  subgraph: { checked: true },
  sliced: { checked: true }
};
const SubGroupMenu = (_props: any) => {
  const isFaker = _props.selectedItem?.faker;
  const props = isFaker ? getFakerProps(_props) : _props;
  const { config = CONFIG, selectedItem, targetShape } = props;
  const { onOpenLeftDrawer, onSaveSliced, onChangeData, onCloseMenu } = props;
  const isResultSelecting = selectedItem?.resultSelecting; // 正在选择添加搜索结果, 禁止某些修改图数据的操作

  const graphLayoutPattern = selectedItem?.graphLayoutPattern;
  if (graphLayoutPattern === GRAPH_LAYOUT_PATTERN.TREE) return null;

  const clickWrap =
    (func: Function) =>
    (...arg: any) =>
      !isFaker && func?.(...arg);

  /**
   * 选中子图
   */
  const onSelect = () => {
    selectedItem.graph?.current?.emit('click', { target: targetShape });
    onCloseMenu();
  };

  /**
   * 保存图切片
   */
  const handleSave = () => {
    const subGroup = selectedItem.graph.current.__getSubGroupById(targetShape.cfg.id);
    if (!subGroup?.cfg?.info) return;
    const data: any = _.pick(subGroup.cfg.info, 'nodes', 'edges');
    const sliced = { ...data };
    sliced.slicedType = data.edges.length ? 'subgraph' : 'other';
    onSaveSliced(sliced);
  };

  /** 移除 */
  const onRemoveItem = () => {
    const subGroup = selectedItem.graph.current.__getSubGroupById(targetShape.cfg.id);
    if (!subGroup?.cfg?.info) return;
    const data: any = _.pick(subGroup.cfg.info, 'nodes', 'edges');
    const length = data.nodes.length + data.edges.length;
    onChangeData({ type: 'delete', data: { ...data, length } });
    onCloseMenu();
    // selectedItem.graph.current.__removeSubGroup(targetShape.cfg.id);
  };

  /** 隐藏 */
  const onHideItem = () => {
    const subGroup = selectedItem.graph.current.__getSubGroupById(targetShape.cfg.id);
    if (!subGroup?.cfg?.info) return;
    const data: any = _.pick(subGroup.cfg.info, 'nodes', 'edges');
    const graphData = selectedItem.apis.getGraphData({ filter: 'all' });
    const hidedNodeMap = _.keyBy(data.nodes);
    const hidedEdgeMap = _.keyBy(data.edges);
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
    _.forEach(selectedItem.graph.current.getNodes(), shape => {
      hidedNodeMap[shape?._cfg?.id] && shape?.hide();
    });
    _.forEach(selectedItem.graph.current.getEdges(), shape => {
      hidedEdgeMap[shape?._cfg?.id] && shape?.hide();
    });
    selectedItem?.graph?.current?.graphStack.pushStack('visible', {
      before: { ...graphData },
      after: { nodes: newNodes, edges: newEdges }
    });
    // graph.current.__canvasRefresh = false;
    onChangeData({ type: 'selected', data: { nodes: [], edges: [] } });
    onChangeData({ type: 'graphData', data: { nodes: newNodes, edges: newEdges } });
    onCloseMenu();
    // selectedItem.graph.current.__removeSubGroup(targetShape.cfg.id);
  };

  const [menus, setMenus] = useState<any[]>([]);
  useEffect(() => {
    const MENU_LIST = [
      {
        id: 'remove',
        title: intl.get('exploreGraph.remove'),
        component: (title: string) => (
          <Menu.Item key="remove" disabled={isResultSelecting} onClick={clickWrap(onRemoveItem)}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'hide',
        title: intl.get('exploreGraph.hide'),
        component: (title: string) => (
          <Menu.Item key="hide" disabled={isResultSelecting} onClick={clickWrap(onHideItem)}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'subgraph',
        title: intl.get('exploreGraph.selectSubgraph'),
        component: (title: string) => (
          <Menu.Item key="subgraph" onClick={onSelect}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'sliced',
        title: intl.get('exploreGraph.sliceTitle'),
        component: (title: string) =>
          isFaker ? (
            <Menu.Item key="sliced">{title}</Menu.Item>
          ) : (
            <Menu.SubMenu key="sliced" popupClassName="graphMenuSub" title={<span>{title}</span>}>
              <Menu.Item key="save" className="sliced-sub-menu-item" onClick={clickWrap(handleSave)}>
                {intl.get('exploreGraph.sliceSave')}
              </Menu.Item>
              <Menu.Item key="list" className="sliced-sub-menu-item" onClick={() => onOpenLeftDrawer?.('sliced')}>
                {intl.get('exploreGraph.sliceList')}
              </Menu.Item>
            </Menu.SubMenu>
          )
      }
    ];
    const visiblyMenus = _.filter(MENU_LIST, menu => config[menu.id] && config[menu.id]?.checked);
    setMenus(visiblyMenus);
    if (_.isEmpty(visiblyMenus)) {
      selectedItem?.graph?.current?.__onSetMenuConfig(null);
    }
  }, [JSON.stringify(config)]);

  if (_.isEmpty(menus)) return null;

  return (
    <div className="subGroupMenuRoot">
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

export default SubGroupMenu;
