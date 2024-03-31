import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Menu } from 'antd';
import { getFakerProps } from '../../utils';
import './style.less';

const CONFIG: any = {
  selectAll: { checked: true },
  deselectNode: { checked: true },
  deselectEdge: { checked: true },
  removeAll: { checked: true }
};
const CanvasMenu = (_props: any) => {
  const isFaker = _props.selectedItem?.faker;
  const props = isFaker ? getFakerProps(_props) : _props;
  const { config = CONFIG, onClickCustom } = props;
  const { selectedItem, onClickCanvasMenu } = props;

  const onClickItem = (type: any, isDisabled = false) => {
    if (isDisabled || isFaker) return;
    onClickCanvasMenu(type);
  };

  const [menus, setMenus] = useState<any>([]);
  useEffect(() => {
    const cancelNode = !isFaker && (_.isEmpty(selectedItem?.selected?.nodes) || selectedItem?.selected?.length === 0);
    const cancelEdge = !isFaker && (_.isEmpty(selectedItem?.selected?.edges) || selectedItem?.selected?.length === 0);
    const length = selectedItem.graph?.current?.getNodes()?.length + selectedItem.graph?.current?.getEdges()?.length;
    const all = !isFaker && selectedItem?.selected?.length === length;
    const MENU_LIST = [
      {
        id: 'selectAll',
        title: intl.get('exploreGraph.selectAll'),
        component: (title: string) => (
          <Menu.Item key="all" disabled={all} onClick={() => onClickItem('selectAll', all)}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'deselectNode',
        title: intl.get('exploreGraph.cancels'),
        component: (title: string) => (
          <Menu.Item key="cancel" disabled={cancelNode} onClick={() => onClickItem('cancelNode', cancelNode)}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'deselectEdge',
        title: intl.get('exploreGraph.cancelRelationship'),
        component: (title: string) => (
          <Menu.Item key="deselectEdge" disabled={cancelEdge} onClick={() => onClickItem('cancelEdge', cancelEdge)}>
            {title}
          </Menu.Item>
        )
      },
      {
        id: 'removeAll',
        title: intl.get('exploreGraph.removeAll'),
        component: (title: string) => (
          <Menu.Item key="relation" disabled={cancelEdge} onClick={() => onClickItem('clearAll')}>
            {title}
          </Menu.Item>
        )
      }
    ];
    const customOptions = _.filter(config, item => item.type === 'custom');
    _.forEach(customOptions, item => {
      MENU_LIST.push({
        id: item.key,
        title: item.alias,
        component: (title: string) => (
          <div className="menuItem kw-align-center" onClick={() => onClickCustom(item)}>
            {title}
          </div>
        )
      });
    });

    const visiblyMenus = _.filter(MENU_LIST, menu => config[menu.id] && config[menu.id]?.checked);
    setMenus(visiblyMenus);
    if (_.isEmpty(visiblyMenus)) {
      selectedItem?.graph?.current?.__onSetMenuConfig(null);
    }
  }, [JSON.stringify(config)]);

  if (_.isEmpty(menus)) return null;

  return (
    <div className="canvasMenuRoot">
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

export default CanvasMenu;
