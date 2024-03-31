import React, { useState, useMemo } from 'react';
import { Dropdown, Menu } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import StyleInput from '../StyleInput';

// 顶部（默认）、底部、左侧、右侧、中间
const POSITIONS = [
  { value: 'top', label: intl.get('exploreGraph.style.top') },
  { value: 'bottom', label: intl.get('exploreGraph.style.bottom') },
  { value: 'left', label: intl.get('exploreGraph.style.left') },
  { value: 'right', label: intl.get('exploreGraph.style.right') },
  { value: 'center', label: intl.get('exploreGraph.style.center') }
];

const PositionDropdown = (props: any) => {
  const { className, style, value, onChange, readOnly } = props;
  const [visible, setVisible] = useState(false);
  const labelObj = useMemo(
    () => _.reduce(POSITIONS, (res, { value, label }) => ({ ...res, [value]: label }), {} as Record<string, string>),
    []
  );

  return (
    <Dropdown
      trigger={['click']}
      visible={visible}
      onVisibleChange={v => !readOnly && setVisible(v)}
      overlay={
        <Menu
          selectedKeys={[value]}
          onClick={({ key }) => {
            onChange(key);
            setVisible(false);
          }}
        >
          {_.map(POSITIONS, item => (
            <Menu.Item key={item.value}>{item.label}</Menu.Item>
          ))}
        </Menu>
      }
    >
      <div className={classNames(className)} style={style}>
        <StyleInput
          label={intl.get('exploreGraph.style.location')}
          data={labelObj[value]}
          arrowRotate={visible ? 180 : 0}
          focused={visible}
          readOnly={readOnly}
        />
      </div>
    </Dropdown>
  );
};

export default PositionDropdown;
