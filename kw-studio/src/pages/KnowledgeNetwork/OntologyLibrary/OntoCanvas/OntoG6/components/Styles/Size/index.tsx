import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import { Dropdown, Menu } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import StyleInput from '../StyleInput';
import './style.less';

const MAX_SIZE = 48;
const SIZES_NODE = [
  { size: 16, label: '0.25x', offset: (MAX_SIZE - 16) / 2 },
  { size: 24, label: '0.5x', offset: (MAX_SIZE - 24) / 2 },
  { size: 36, label: '1x', offset: (MAX_SIZE - 36) / 2 },
  { size: 48, label: '2x', offset: (MAX_SIZE - 48) / 2 },
  { size: 64, label: '4x', offset: (MAX_SIZE - 64) / 2 }
];

const SIZES_EDGE = [
  { size: 0.75, label: '0.25x' },
  { size: 2, label: '0.5x' },
  { size: 3, label: '1x' },
  { size: 5, label: '2x' },
  { size: 10, label: '4x' }
];

const SOURCE: any = {
  node: SIZES_NODE,
  edge: SIZES_EDGE
};

const Size = (props: any) => {
  const { className, style, value, modalType, readOnly } = props;
  const { onChange } = props;
  const [visible, setVisible] = useState(false);
  const labelObj = useMemo(
    () =>
      _.reduce(SOURCE[modalType], (res, { size, label }) => ({ ...res, [size]: label }), {} as Record<string, string>),
    []
  );

  return (
    <div className={classNames(className, 'onto-size-selector')}>
      <Dropdown
        trigger={['click']}
        visible={visible}
        onVisibleChange={v => !readOnly && setVisible(v)}
        overlay={
          <Menu
            selectedKeys={[String(value)]}
            onClick={({ key }) => {
              onChange(key);
              setVisible(false);
            }}
          >
            {_.map(SOURCE[modalType], item => (
              <Menu.Item key={String(item.size)}>{item.label}</Menu.Item>
            ))}
          </Menu>
        }
      >
        <div className={classNames(className)} style={style}>
          <StyleInput
            label={intl.get('exploreGraph.style.size')}
            data={labelObj[value]}
            arrowRotate={visible ? 180 : 0}
            focused={visible}
            readOnly={readOnly}
          />
        </div>
      </Dropdown>
    </div>
  );
};

export default Size;
