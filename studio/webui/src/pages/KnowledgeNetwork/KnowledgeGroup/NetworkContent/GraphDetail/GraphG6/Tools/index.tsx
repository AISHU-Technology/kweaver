import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';

import './style.less';

const Tools = (props: any) => {
  const { graph, graphContainer } = props;

  const onMoveToCenter = () => {
    graph.current.fitView(40, { onlyOutOfViewPort: true, direction: 'y' });
  };

  const onZoomChange = (mark: string) =>
    _.throttle(() => {
      const width = graphContainer.current?.clientWidth || 0;
      const height = graphContainer.current?.clientHeight || 0;
      const newRatio = mark === '+' ? 1.1 : 0.9;
      graph.current.zoom(newRatio, { x: Math.floor(width / 2), y: Math.floor(height / 2) });
    }, 500);

  return (
    <div className="toolsRoot">
      <Tooltip placement="right" title={intl.get('graphDetail.locate')}>
        <div className="toolButton" onClick={onMoveToCenter}>
          <IconFont type="icon-dingwei" style={{ fontSize: 14 }} />
        </div>
      </Tooltip>
      <Tooltip placement="right" title={intl.get('graphDetail.zoomOut')}>
        <PlusOutlined className="toolButton add" onClick={onZoomChange('+')} />
      </Tooltip>
      <Tooltip placement="right" title={intl.get('graphDetail.zoomIn')}>
        <MinusOutlined className="toolButton reduce" onClick={onZoomChange('-')} />
      </Tooltip>
    </div>
  );
};

export default Tools;
