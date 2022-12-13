import React, { memo } from 'react';
import classNames from 'classnames';
import './style.less';

export interface GraphNodeProps {
  data: Record<string, any>;
  type: 'edge' | 'entity';
}

const GraphNode = (props: GraphNodeProps) => {
  const { data, type } = props;
  const { alias, color, sourceAlias, targetAlias, relations = [] } = data;
  const startNode = sourceAlias || relations[0];
  const endNode = targetAlias || relations[2];

  return (
    <div
      className="graph-group-tree-node ad-align-center"
      style={{ lineHeight: type === 'edge' ? '24px' : '36px' }}
      title=""
    >
      <div className={classNames('node-icon', type === 'entity' ? 'circle' : '')} style={{ background: color }} />
      <div className="node-info">
        <div className="node-name ad-ellipsis" title={alias}>
          {alias || '--'}
        </div>
        {type === 'edge' && (
          <div className="ad-align-center ad-c-subtext">
            <div className="start-node ad-ellipsis" title={startNode}>
              {startNode}
            </div>
            &nbsp;&gt;&nbsp;
            <div className="end-node ad-ellipsis" title={endNode}>
              {endNode}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(GraphNode);
