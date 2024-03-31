import React from 'react';

import LabelNode from './LabelNode';
import LabelEdge from './LabelEdge';
import LabelMore from './LabelMore';

import './style.less';

const Label = (props: any) => {
  const { value, modalType, shapeType, isBatchClass, disabledPosition } = props;
  const { onChange } = props;

  if (modalType === 'node') {
    return (
      <LabelNode
        value={value}
        shapeType={shapeType}
        isBatchClass={isBatchClass}
        disabledPosition={disabledPosition}
        onChange={onChange}
      />
    );
  }
  if (modalType === 'edge') return <LabelEdge value={value} onChange={onChange} />;
  if (modalType === 'more') return <LabelMore value={value} onChange={onChange} />;
  return null;
};

export default Label;
