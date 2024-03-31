import React from 'react';
import type { SelectProps } from 'antd';
import NodeSelector from './NodeSelector';
import EdgeSelector from './EdgeSelector';

interface TypeSelect extends SelectProps {
  data: any;
  type: 'v_filters' | 'e_filters'; // node type or edge type
  classList: any[]; // node class edge class list
  className?: string;
  isDisabled?: boolean;
  entities: any; // Ontology entity information
  onChange: (item: any) => void;
}

const SelectorClass = (props: TypeSelect) => {
  const { type } = props;
  return <>{type === 'v_filters' ? <NodeSelector {...props} /> : <EdgeSelector {...props} />}</>;
};

export default SelectorClass;
