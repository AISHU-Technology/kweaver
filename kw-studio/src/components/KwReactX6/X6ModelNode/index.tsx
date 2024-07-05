import React, { memo } from 'react';
import classNames from 'classnames';
import { Graph, Node } from '@antv/x6';

import IconFont from '@/components/IconFont';

import './style.less';

const X6ModelNode = (props: { node: Node; graph: Graph }) => {
  const { node } = props;
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
