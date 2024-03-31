import React, { useMemo } from 'react';
import PreviewCanvas from '../../../components/PreviewCanvas';

const SubGraph = (props: any) => {
  const { data } = props;
  const graphData = useMemo(() => ({ nodes: data?.nodesDetail || [], edges: data.edgesDetail || [] }), [data]);
  return (
    <div style={{ height: 300, backgroundColor: '#f8f8f8' }}>
      <PreviewCanvas graphData={graphData} layout="free" />
    </div>
  );
};

export default SubGraph;
