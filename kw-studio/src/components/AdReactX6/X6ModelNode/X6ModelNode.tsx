import React, { memo } from 'react';
import './style.less';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import { Graph, Node } from '@antv/x6';

const X6ModelNode = (props: { node: Node; graph: Graph }) => {
  const { node, graph } = props;
  const nodeDataConfig = node?.getData();
  const prefixCls = 'kw-x6-model-node';
  return (
    <div className={classNames(prefixCls, 'kw-align-center kw-p-2 kw-border kw-bg-white')}>
      <IconFont type="graph-model" style={{ fontSize: 20 }} />
      <span className="kw-flex-item-full-width kw-ellipsis kw-ml-2" title={nodeDataConfig.label}>
        {nodeDataConfig.label}
      </span>
    </div>
  );
};

export default memo(X6ModelNode);
