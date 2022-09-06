import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import { Menu } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';

import './style.less';

export type SidebarType = {
  style?: any;
  className?: string;
  [key: string]: any;
};
type MenuItem = {
  key: string;
  icon?: React.HTMLProps<HTMLSpanElement>;
  label: string;
  children?: any;
};

const Sidebar = (props: SidebarType) => {
  const history = useHistory();
  const { style, className, source } = props;
  const { value, onChange } = props;

  const [isClose, setIsClose] = useState(false);
  const [openKeys, setOpenKeys] = useState<any>([]);
  const [selectedKey, setSelectedKey] = useState([source?.[0]?.key || '']);
  const { renderItem, sourceKV } = useMemo(() => {
    const sourceKV: any = {};
    const getItem = (items: MenuItem, parentKey: string[]) =>
      _.map(items || [], item => {
        const { key, icon, label, children } = item;
        sourceKV[key] = { ...item, parentKey };
        if (children) {
          return (
            <Menu.SubMenu popupClassName="subPopupMenu" key={key} icon={icon} title={label}>
              {getItem(children, [...parentKey, key])}
            </Menu.SubMenu>
          );
        }
        return (
          <Menu.Item key={key} icon={icon}>
            {label}
          </Menu.Item>
        );
      });
    return { renderItem: getItem(source, []), sourceKV };
  }, [source]);

  useEffect(() => {
    if (value) {
      if (sourceKV[value]) setOpenKeys(sourceKV[value]?.parentKey || []);
      setSelectedKey([value]);
    }
  }, [value]);

  const onClick = (e: any) => {
    const key = e?.key;
    const item = sourceKV[key];

    setSelectedKey([key]);
    if (onChange) onChange(key);
    if (item?.onClick) item.onClick();
    if (item?.bindRoute) history.push(item.key);
  };

  const onOpenChange = (openKeys: string[]) => {
    const key = openKeys?.length > 0 ? openKeys.pop() : '';
    setOpenKeys([key]);
  };

  const toggleCollapsed = () => setIsClose(!isClose);

  return (
    <div
      className={classnames('sidebarRootC', className)}
      style={{ ...(isClose ? { width: 64 } : { width: 220, minWidth: 220 }), ...style }}
    >
      <Menu
        className="menu"
        mode="inline"
        openKeys={openKeys}
        inlineCollapsed={isClose}
        selectedKeys={selectedKey}
        onClick={onClick}
        onOpenChange={onOpenChange}
      >
        {renderItem}
      </Menu>
      <span className="toggleMenuBut" onClick={toggleCollapsed}>
        {isClose ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </span>
      <svg>
        <filter id="filterRed">
          <feColorMatrix
            values="0 0 0 0
              0.022 0 0 0
              0 0.2 0.3 0
              0 0 1 1
              0 0 1 0"
          />
        </filter>
      </svg>
    </div>
  );
};

export default Sidebar;
