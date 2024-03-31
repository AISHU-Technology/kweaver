import React, { useMemo } from 'react';
import _ from 'lodash';
import { Menu } from 'antd';
import { triggerSelect, triggerHover } from './subGroupEvent';

const SubGroupMenuItem = (props: any) => {
  // 外部的Menu组件会隐秘的注入额外属性, 需要手动传递otherProps给Menu.Item
  const { title, selectedNode, selectedItem, onCloseMenu, ...otherProps } = props;
  const relationSubgraph = useMemo(() => {
    if (!selectedNode || !selectedItem) return [];
    const nodeId = selectedNode.get('id');
    const subGroups = selectedItem.graph.current.__getSubGroups();
    const result: any[] = [];
    _.forEach(_.values(subGroups), group => {
      if (_.includes(group.cfg?.info?.nodes, nodeId) || _.includes(group.cfg?.info?.edges, nodeId)) {
        result.push(group);
      }
    });
    return result;
  }, [selectedNode]);

  /**
   * 选中子图
   * @param groupShape 子图类实例
   */
  const onSelectSubgraph = (groupShape: any) => {
    triggerSelect(groupShape, selectedItem.graph);
    onCloseMenu?.();
  };

  const onMouseEnter = (groupShape: any) => {
    triggerHover(groupShape, selectedItem.graph, true);
  };

  const onMouseLeave = (groupShape: any) => {
    triggerHover(groupShape, selectedItem.graph, false);
  };

  if (relationSubgraph.length < 2) {
    return (
      <Menu.Item
        key="subgraph"
        onClick={() => onSelectSubgraph(relationSubgraph[0])}
        disabled={!relationSubgraph.length}
        {...otherProps}
      >
        {title}
      </Menu.Item>
    );
  }
  return (
    <Menu.SubMenu key="subgraph" title={<span>{title}</span>} {...otherProps}>
      {_.map(relationSubgraph, group => {
        return (
          <Menu.Item key={group.cfg.id} className="sliced-sub-menu-item" onClick={() => onSelectSubgraph(group)}>
            <div
              className="kw-h-100 kw-ellipsis"
              title={group.cfg?.name}
              onMouseEnter={() => onMouseEnter(group)}
              onMouseLeave={() => onMouseLeave(group)}
            >
              {group.cfg?.name}
            </div>
          </Menu.Item>
        );
      })}
    </Menu.SubMenu>
  );
};

export default SubGroupMenuItem;
