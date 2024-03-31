import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';

import { GRAPH_LAYOUT_TREE_DIR } from '@/enums';
import registerNodeText from '../../GraphG6/registerNodeText';
import registerNodeCircle from '../../GraphG6/registerNodeCircle';
import registerTreeNodeRect from '../../GraphG6/registerTreeNodeRect';
import registerLinePolyline from '../../GraphG6/registerLinePolyline';
import LayoutTree from '../../GraphG6/Layout/Tree';

const PreGraph = (props: any) => {
  const { config = {}, source } = props;
  const graph = useRef<any>(null);
  const canvas = useRef<any>(null);
  const container = useRef<any>(null);

  const [isFirst, setIsFirst] = useState(true);
  useEffect(() => {
    const _config = _.isEmpty(config) ? GRAPH_LAYOUT_TREE_DIR.DEFAULT_CONFIG : config;
    registerNodeText('nodeText');
    registerLinePolyline('customPolyline');
    registerNodeCircle('customCircle');
    registerTreeNodeRect('customRect');
    canvas.current = new LayoutTree({
      source,
      cache: {},
      config: _config,
      container: container.current
    });

    graph.current = canvas.current.Graph;
    canvas.current.changeData(source);
    graph.current.render();
    graph.current.zoomTo(1);
    graph.current.fitCenter();
  }, []);

  useEffect(() => {
    if (isFirst) return setIsFirst(false);
    canvas.current.changeData(source);
    graph.current.render();
    graph.current.zoomTo(1);
    graph.current.fitCenter();
  }, [JSON.stringify(source)]);

  return <div ref={container} style={{ width: '100%', height: '100%' }} />;
};

export default PreGraph;
