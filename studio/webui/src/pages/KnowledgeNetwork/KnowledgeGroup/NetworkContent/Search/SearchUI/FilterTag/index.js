/**
 * 筛选标签
 * @author Jason.ji
 * @date 2022/01/07
 *
 */

import React, { memo } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './style.less';

const showTag = data => {
  if (!data.value) return;

  const { pro, rangeType, value } = data;

  switch (rangeType) {
    case '=':
      return `${pro}：${value[0]}`;
    case '>':
      return `${pro} > ${value[0]}`;
    case '<':
      return `${pro} < ${value[0]}`;
    case '~':
      return `${pro}：${value[0]} ~ ${value[1]}`;
    default:
      return `${pro}：${value[0]}`;
  }
};

const FilterTag = props => {
  const { className, index, data, onDelete } = props;
  const text = showTag(data);

  return (
    <div className={`flter-tag-item ${className}`}>
      <span className="tag-name" title={text}>{text}</span>
      <span className="close-wrap" onClick={e => onDelete(index)}>
        <CloseOutlined />
      </span>
    </div>
  );
};

FilterTag.defaultProps = {
  className: '',
  index: 0,
  data: {},
  onDelete: () => {}
};

export default memo(FilterTag);
