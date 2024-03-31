import { useRef, useState, useCallback } from 'react';

import GraphStore from './GraphStore';

/** 强制更新 */
const useForceUpdate = () => {
  const [, setValue] = useState(0);
  return useCallback(() => {
    setValue((val: number) => (val + 1) % (Number.MAX_SAFE_INTEGER - 1));
  }, []);
};

const useGraph = (graph?: any) => {
  const graphRef = useRef<any>();
  const forceUpdate = useForceUpdate();

  if (!graphRef.current) {
    if (graph) {
      graphRef.current = graph;
    } else {
      graphRef.current = new GraphStore(forceUpdate);
    }
  }

  return [graphRef.current];
};

export default useGraph;
