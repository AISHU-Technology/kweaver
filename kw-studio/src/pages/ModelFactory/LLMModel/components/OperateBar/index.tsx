import React, { useState } from 'react';
import { Dropdown, Menu } from 'antd';
import type { MenuProps, DropDownProps } from 'antd';
import { LoadingOutlined, EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import _ from 'lodash';

import './style.less';

export interface OperateBarProps {
  className?: string;
  style?: React.CSSProperties;
  testLoading?: boolean;
  items: { key: string; label: string; props?: any }[];
  disabledKeys?: Record<string, boolean>;
  onItemClick?: (key: string) => void;
  getPopupContainer?: DropDownProps['getPopupContainer'];
}

const OperateBar = (props: OperateBarProps) => {
  const { className, style, testLoading, items, disabledKeys, onItemClick, getPopupContainer } = props;
  const [visible, setVisible] = useState(false);

  const handleClick: MenuProps['onClick'] = info => {
    info.domEvent.stopPropagation();
    onItemClick?.(info.key);
    info.key !== 'test' && setVisible(false); // 测试时不关闭下拉
  };

  return (
    <Dropdown
      open={visible}
      placement="bottomLeft"
      destroyPopupOnHide
      trigger={['click']}
      getPopupContainer={getPopupContainer}
      onOpenChange={setVisible}
      overlay={
        <Menu style={{ minWidth: 120 }} onClick={handleClick}>
          {_.map(items, item => (
            <Menu.Item key={item.key} disabled={disabledKeys?.[item.key]} {...(item?.props || {})}>
              {item.key === 'test' && testLoading && <LoadingOutlined className="kw-mr-2 kw-c-primary" />}
              {item.label}
            </Menu.Item>
          ))}
        </Menu>
      }
    >
      <div
        className={classNames(className, 'llm-op-bar-root kw-center kw-pointer', { focused: visible })}
        style={style}
        onClick={e => e.stopPropagation()}
      >
        <EllipsisOutlined style={{ fontSize: 20 }} />
      </div>
    </Dropdown>
  );
};

export default OperateBar;
