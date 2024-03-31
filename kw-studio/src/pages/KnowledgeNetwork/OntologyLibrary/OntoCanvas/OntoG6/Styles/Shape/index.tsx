import React from 'react';

import ShapeNode from './ShapeNode';
import ShapeEdge from './ShapeEdge';

import './style.less';

const Shape = (props: any) => {
  const { value, modalType } = props;
  const { ontoLibType, selectedElement } = props;
  const { onChange } = props;

  if (modalType === 'node') return <ShapeNode value={value} onChange={onChange} />;
  if (modalType === 'more') return <ShapeNode value={value} onChange={onChange} />;
  if (modalType === 'edge') return <ShapeEdge value={value} onChange={onChange} />;
  return null;
};

export default Shape;
