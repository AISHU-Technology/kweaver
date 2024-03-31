/**
 * 渲染语句的tabs, 简单封装, 不受控
 * 不使用antd的Tabs, 是因为顶层组件使用了Tabs, 及其容易导致样式污染
 */
import React, { useState } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import './style.less';

export interface CustomTabsProps {
  className?: string;
  style?: React.CSSProperties;
  items: {
    key: string;
    tab: React.ReactNode;
    content?: React.ReactNode;
  }[];
}

const CustomTabs = (props: CustomTabsProps) => {
  const { className, style, items = [] } = props;
  const [activeKey, setActiveKey] = useState(items[0]?.key);

  return (
    <div className={classNames(className, 'statement-custom-tabs')} style={style}>
      <div className="tab-nav kw-flex">
        {_.map(items, item => (
          <div
            key={item.key}
            className={classNames('tab-nav-btn', { 'tab-nav-active': activeKey === item.key })}
            onClick={() => setActiveKey(item.key)}
          >
            {item.tab}
          </div>
        ))}
      </div>
      <div className="tab-holder">
        {_.map(items, item => (
          <div key={item.key} className="tab-panel" style={{ display: activeKey === item.key ? undefined : 'none' }}>
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomTabs;
