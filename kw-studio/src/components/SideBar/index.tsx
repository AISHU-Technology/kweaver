import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Menu, Button, Tooltip } from 'antd';
import type { SelectEventHandler } from 'rc-menu/lib/interface';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Format from '@/components/Format';

import DragLine from '@/components/DragLine';

import './style.less';

const initWidth = 220;
const minWidth = 56;
const maxWidth = 420;
const smallWidth = 150;
const Divider = (props: any) => {
  return (
    <Tooltip title={props.label} placement="right">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: 22 }}>
        <div style={{ background: 'rgba(0,0,0,.10)', height: 1, width: '40%' }} />
      </div>
    </Tooltip>
  );
};

export interface SideBarItemProps {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  selectedIcon?: React.ReactNode;
  children?: SideBarItemProps[];
}

export interface SideBarProps {
  style?: React.CSSProperties;
  className?: string; // 类名
  extraFooter?: React.ReactNode; // 额外的footer
  items: SideBarItemProps[]; // 菜单配置项
  openKeys?: string[]; // 展开的菜单key
  selectedKeys: string[]; // 选中的菜单key
  onSelectedKeysChange: SelectEventHandler; // 菜单选中的值变化事件
  onCollapsedChange?: (collapsed: boolean) => void; // 菜單欄展开收起值变化事件
  collapseBtnVisible?: boolean; // 折叠按钮是否显示
  draggable?: boolean; // 是否允许拖动改变宽度
}

const SideBar: React.FC<SideBarProps> = props => {
  const {
    style,
    className,
    extraFooter = null,
    items,
    openKeys: _openKeys,
    selectedKeys,
    collapseBtnVisible = true,
    draggable = true,
    onSelectedKeysChange,
    onCollapsedChange
  } = props;
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState(_openKeys || []);
  const [scalingWidth, setScalingWidth] = useState(initWidth);

  /** submenu展开列控制 */
  useEffect(() => {
    if (_openKeys) {
      setOpenKeys(_openKeys);
    }
  }, [JSON.stringify(_openKeys)]);

  /** 菜单收起时，submenu同时收起 */
  useEffect(() => {
    if (collapsed) setOpenKeys([]);
    if (!collapsed) setOpenKeys(openKeys);
  }, [collapsed]);

  /** 拖动宽度小于最小收起时，直接收起 */
  useEffect(() => {
    if (scalingWidth < smallWidth) {
      onCollapsedChange?.(true);
      setCollapsed(true);
      return;
    }
    setCollapsed(false);
    onCollapsedChange?.(false);
  }, [scalingWidth]);

  /** 拖动宽度变更 */
  const onChangeWidth = (offset: number) => {
    const x = scalingWidth + offset;
    const curWidth = x > maxWidth ? maxWidth : x < minWidth ? minWidth : x;
    setScalingWidth(curWidth);
  };
  /** 拖动宽度结束 */
  const onChangeEndWidth = (offset: number) => {
    const x = scalingWidth + offset;
    const curWidth = x > maxWidth ? maxWidth : x < minWidth ? minWidth : x;
    if (curWidth < smallWidth) setScalingWidth(minWidth);
  };

  /** 切换侧边栏模式 */
  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    onCollapsedChange?.(newCollapsed);
    setCollapsed(newCollapsed);
    if (newCollapsed === true) setScalingWidth(minWidth);
    if (newCollapsed === false) setScalingWidth(initWidth);
  };

  const renderItems = (item: any, isLast: boolean, collapsed: boolean) => {
    const { key, icon, selectedIcon, type, label, children } = item;
    const activeKey = selectedKeys[0] ?? '';
    const hasIcon = !!icon && !!selectedIcon;
    const subMenuCollapsed = openKeys.length === 0;
    const recursionChildren = (children: any, subItem?: any) => {
      const menuItems = _.map(children, child => {
        const { key, icon, selectedIcon, label } = child;
        const hasIcon = !!icon && !!selectedIcon;
        if (child.children) {
          return recursionChildren(child.children, child);
        }
        return (
          <Menu.Item key={key}>
            <span>
              {hasIcon && <span className="menuTitleIcon">{activeKey === key ? selectedIcon : icon}</span>}
              <span className={hasIcon ? 'menuTitleLabel' : 'menuTitleLabelNotIcon'}>{label}</span>
            </span>
          </Menu.Item>
        );
      });
      return (
        <Menu.SubMenu
          key={subItem?.key || key}
          className="sideMenuSub"
          title={
            <span className="menuTitle">
              {hasIcon && (
                <span className="menuTitleIcon">{activeKey === key && subMenuCollapsed ? selectedIcon : icon}</span>
              )}
              <span className={hasIcon ? 'menuTitleLabel' : 'menuTitleLabelNotIcon'}>{subItem?.label || label}</span>
            </span>
          }
        >
          {collapsed ? <Menu.ItemGroup title={label}>{menuItems}</Menu.ItemGroup> : menuItems}
        </Menu.SubMenu>
      );
    };
    if (type === 'group') {
      return (
        <Menu.ItemGroup key={key} title={collapsed ? <Divider label={label} /> : label}>
          {_.map(children, (child, index) => renderItems(child, children.length === index + 1, collapsed))}
          {!isLast && !collapsed && <Menu.Divider style={{ margin: '0 16px', borderColor: 'rgba(0,0,0,.10)' }} />}
        </Menu.ItemGroup>
      );
    }
    if (_.isEmpty(children)) {
      return (
        <Menu.Item key={key}>
          <span className="menuTitle">
            {hasIcon && <span className="menuTitleIcon">{activeKey === key ? selectedIcon : icon}</span>}
            <span className={hasIcon ? 'menuTitleLabel' : 'menuTitleLabelNotIcon'} title={label}>
              {label}
            </span>
          </span>
        </Menu.Item>
      );
    }
    return recursionChildren(children);
  };

  const wrapperStyle = style
    ? {
        ...style,
        width: scalingWidth,
        minWidth: scalingWidth
      }
    : {
        width: scalingWidth,
        minWidth: scalingWidth
      };

  return (
    <div className={classnames('sideRoot kw-flex-column', className)} style={wrapperStyle}>
      {draggable && (
        <DragLine
          className="dragLine"
          style={{ left: scalingWidth - 5 }}
          onChange={onChangeWidth}
          onEnd={onChangeEndWidth}
        />
      )}
      <Menu
        className={classnames('sideRoot-menu kw-flex-item-full-height', {
          sideMenuCollapsed: collapsed
        })}
        mode="inline"
        inlineCollapsed={collapsed}
        openKeys={openKeys}
        selectedKeys={selectedKeys}
        onSelect={onSelectedKeysChange}
        onOpenChange={(data: any) => setOpenKeys(data)}
      >
        {_.map(items, (item, index: number) => renderItems(item, items.length === index + 1, collapsed))}
      </Menu>
      <div
        className={classnames('sideRoot-footer', {
          'sideRoot-footer-collapsed': collapsed
        })}
      >
        {extraFooter && <div className="sideRoot-footer-extra">{extraFooter}</div>}

        {collapseBtnVisible && (
          <div className="kw-pb-3" style={{ textAlign: collapsed ? 'center' : 'right' }}>
            <Format.Button
              tipPosition={'right'}
              tip={collapsed ? intl.get('global.expand') : intl.get('global.unExpand')}
              type="icon"
              onClick={toggleCollapsed}
            >
              {collapsed ? <MenuUnfoldOutlined className="buttonIcon" /> : <MenuFoldOutlined className="buttonIcon" />}
            </Format.Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;
