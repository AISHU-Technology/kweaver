import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Menu } from 'antd';

import { GRAPH_LAYOUT_PATTERN } from '@/enums';
import { getSavedSlicedData } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/Sliced/assistant';
import SubGroupMenuItem from '../SubGroupMenuItem';
import { getFakerProps } from '../../utils';
import './style.less';

const CONFIG = {
  style: { checked: true },
  remove: { checked: true },
  hide: { checked: true },
  selectSame: { checked: true },
  subgraph: { checked: true },
  sliced: { checked: true }
};
const EdgeContextmenu = (_props: any) => {
  const isFaker = _props.selectedItem?.faker;
  const props = isFaker ? getFakerProps(_props) : _props;
  const { config = CONFIG, onClickCustom, selectedItem } = props;
  const {
    selectedNode,
    onSelectSameClass,
    onRemoveItem,
    onHideItem,
    onOpenDisplayModal,
    onOpenLeftDrawer,
    onSaveSliced,
    onCloseMenu
  } = props;
  const isResultSelecting = selectedItem?.resultSelecting; // 正在选择添加搜索结果, 禁止某些修改图数据的操作
  const graphLayoutPattern = selectedItem?.graphLayoutPattern;

  /**
   * 打开保存切片弹窗
   */
  const handleSaveSliced = () => {
    const nodes = [...(selectedItem?.selected?.nodes || [])];
    const edges = [...(selectedItem?.selected?.edges || [])];
    edges.push(selectedNode);
    const data = getSavedSlicedData({ nodes, edges }, selectedItem.graph.current.__getSubGroups());
    onSaveSliced?.(data);
  };

  const [menus, setMenus] = useState<any>([]);
  useEffect(() => {
    const MENU_LIST = [
      {
        id: 'style',
        title: intl.get('exploreGraph.appearance'),
        component: (title: string) => (
          <Menu.Item
            key="style"
            disabled={!isFaker && isResultSelecting}
            onClick={() => {
              const model = selectedNode?.getModel();
              if (!model) return;
              const updateData = _.cloneDeep(model?._sourceData);
              delete updateData.type;
              onOpenDisplayModal(updateData);
            }}
          >
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'remove',
        title: intl.get('exploreGraph.remove'),
        component: (title: string) => (
          <Menu.Item key="remove" disabled={!isFaker && isResultSelecting} onClick={onRemoveItem}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'hide',
        title: intl.get('exploreGraph.hide'),
        component: (title: string) => (
          <Menu.Item key="hide" disabled={!isFaker && isResultSelecting} onClick={onHideItem}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'selectSame',
        title: intl.get('exploreGraph.selectSame'),
        component: (title: string) => (
          <Menu.Item key="selectSame" disabled={!isFaker && isResultSelecting} onClick={onSelectSameClass}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'subgraph',
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
        id: 'sliced',
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
    const customOptions = _.filter(config, item => item.type === 'custom');
    _.forEach(customOptions, item => {
      MENU_LIST.push({
        id: item.key,
        title: item.alias,
        component: (title: string) => (
          <Menu.Item
            key={item.key}
            title={item.alias}
            disabled={!isFaker && isResultSelecting}
            onClick={() => onClickCustom(item)}
          >
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
    <div className="edgeMenuRoot">
      <Menu className="graphMenu" triggerSubMenuAction="click">
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
export default EdgeContextmenu;
