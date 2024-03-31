import React, { useMemo } from 'react';
import _ from 'lodash';
import PreviewCanvas from '../../../PreviewCanvas';

/**
 * 子图
 * @param props
 */
const SubGraph = (props: { nodes: any[]; edges: any[] }) => {
  const { nodes, edges } = props;
  const graphData = useMemo(() => _.cloneDeep({ nodes, edges }), [nodes, edges]);
  return (
    <div style={{ height: 300, backgroundColor: '#f8f8f8' }}>
      <PreviewCanvas graphData={graphData} layout="free" />
    </div>
  );
};

export default SubGraph;
