import React, { useState } from 'react';
import _ from 'lodash';
import DragLine from '@/components/DragLine';
import GraphList from './GraphList';
import NodeList from './NodeList';
import './style.less';

import { useCard } from '../useCard';

export interface BlockSourceProps {
  triggerSave?: () => any;
}

const BlockSource = (props: BlockSourceProps) => {
  const { triggerSave } = props;
  const { state } = useCard();
  const { selectedGraph } = state;
  const [scalingHeight, setScalingHeight] = useState(320);
  const setScalingHeightThrottle = _.throttle(h => {
    setScalingHeight(h);
  }, 100);

  /**
   * 布局拉伸
   * @param yOffset 垂直方向偏移量
   */
  const onHeightDrag = (xOffset: number, yOffset: number) => {
    const y = scalingHeight + yOffset;
    const min = 200;
    const max = window.innerHeight - 200;
    const curHeight = y > max ? max : y < min ? min : y;
    setScalingHeightThrottle(curHeight);
  };

  return (
    <div className="blockSourceRoot kw-flex-column">
      <div
        style={{
          height: selectedGraph?.kg_id ? scalingHeight : '100%',
          borderBottom: '1px solid var(--kw-line-color)',
          flexShrink: 0
        }}
      >
        <GraphList triggerSave={triggerSave} />
      </div>

      {!!selectedGraph?.kg_id && (
        <>
          <DragLine className="height-drag-line" style={{ top: scalingHeight - 5 }} onChange={onHeightDrag} />
          <div className="kw-flex-item-full-height">
            <NodeList key={selectedGraph?.id} triggerSave={triggerSave} />
          </div>
        </>
      )}
    </div>
  );
};

export default BlockSource;
