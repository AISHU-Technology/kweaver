import React, { useState } from 'react';
import { Dropdown, Menu } from 'antd';
import _ from 'lodash';
import { EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import '../style.less';

type MyData = {
  name: string;
  age: number;
  id: string;
  // 其他可能的属性
  [key: string]: any;
};
type RenderIntentItemType = {
  className?: any;
  data: MyData;
  hasEditor: boolean; // 是否显示操作
  opList: any[]; // 操作选项
  onClick: (key: string) => void;
  onSelected: (id: string) => void;
};

const RenderItem = (props: RenderIntentItemType) => {
  const { data, opList, hasEditor, onClick, onSelected } = props;
  const overlay = (
    <Menu
      style={{ width: 160 }}
      onClick={({ key }: any) => {
        onClick(key);
        onSelected('');
      }}
    >
      {_.map(opList, op => {
        return <Menu.Item key={op?.key}>{op?.label}</Menu.Item>;
      })}
    </Menu>
  );

  return (
    <div className={classNames(props?.className, 'intentItem kw-space-between')}>
      <div className="kw-flex-item-full-width">
        <div className="kw-c-text name kw-ellipsis" title={data?.name || data?.intent}>
          {data?.name || data?.intent}
        </div>
        <div className="kw-c-subtext desc kw-ellipsis" title={data?.description}>
          {data?.description}
        </div>
      </div>
      {hasEditor ? null : (
        <Dropdown
          overlay={overlay}
          trigger={['click']}
          onOpenChange={e => {
            onSelected(e ? data?.id : '');
          }}
        >
          <div className="more kw-center kw-pointer">
            <EllipsisOutlined style={{ transform: 'translate(1px, -3px)' }} />
          </div>
        </Dropdown>
      )}
    </div>
  );
};
export default RenderItem;
