import React from 'react';
import type { SelectProps } from 'antd';
import NodeSelector from './NodeSelector';
import EdgeSelector from './EdgeSelector';

interface TypeSelect extends SelectProps {
  data: any;
  entities: any;
  classList: any[];
  className?: string;
  isDisabled?: boolean;
  onChange: (item: any) => void;
  type: 'v_filters' | 'e_filters';
}

const SelectorClass = (props: TypeSelect) => {
  const { type } = props;
  return <>{type === 'v_filters' ? <NodeSelector {...props} /> : <EdgeSelector {...props} />}</>;
};

export default SelectorClass;
