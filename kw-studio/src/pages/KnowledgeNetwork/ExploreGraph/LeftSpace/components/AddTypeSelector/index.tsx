import React from 'react';
import { Select } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import './style.less';

export const ADD_TYPES = {
  ADD_IMMEDIATELY: 'add-immediately', // 立即-叠加添加
  COVER_IMMEDIATELY: 'cover-immediately', // 立即-覆盖添加
  ADD_SELECT: 'add-select', // 选择-叠加添加
  COVER_SELECT: 'cover-select' // 选择-覆盖添加
};

export const ADD_TYPES_SIMPLE = {
  ADD: 'add',
  COVER: 'cover'
};

const getText = (type: string) => {
  switch (type) {
    case ADD_TYPES.ADD_IMMEDIATELY:
      return intl.get('exploreGraph.addNow'); // '立即-叠加添加'
    case ADD_TYPES.COVER_IMMEDIATELY:
      return intl.get('exploreGraph.coverNow'); // '立即-覆盖添加'
    case ADD_TYPES.ADD_SELECT:
      return intl.get('exploreGraph.addSelect'); // '选择-叠加添加'
    case ADD_TYPES.COVER_SELECT:
      return intl.get('exploreGraph.coverSelect'); // '选择-覆盖添加';
    case ADD_TYPES_SIMPLE.ADD:
      return intl.get('exploreGraph.addBtn'); // '叠加添加';
    case ADD_TYPES_SIMPLE.COVER:
      return intl.get('exploreGraph.coverBtn'); // '覆盖添加';
    default:
      break;
  }
};

export interface AddTypeSelectorProps {
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  horizontal?: boolean; // 水平布局
  mode?: 'default' | 'simple'; // simple只有`叠加添加`和`覆盖添加`
  value?: string;
  onChange?: (value: string) => void;
}

const AddTypeSelector = (props: AddTypeSelectorProps) => {
  const { className, style, readOnly, horizontal, mode = 'default', value, onChange } = props;
  return (
    <div
      className={classNames(className, 'canvas-add-type-selector', {
        'lay-horizontal': horizontal
      })}
      style={style}
    >
      <div className={classNames('kw-c-header', horizontal ? 'kw-mr-2' : 'kw-mb-2')}>
        {intl.get('exploreGraph.addTypeTitle')}
      </div>
      <Select
        className={classNames({ 'kw-w-100': !horizontal })}
        open={readOnly ? false : undefined}
        value={value}
        onChange={onChange}
      >
        {_.values(mode === 'default' ? ADD_TYPES : ADD_TYPES_SIMPLE).map(type => (
          <Select.Option key={type}>{getText(type)}</Select.Option>
        ))}
      </Select>
    </div>
  );
};

export default AddTypeSelector;
