import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Divider, Select } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';

import './style.less';

const Tools = (props: any) => {
  const { graph } = props;
  const [zoom, setZoom] = useState(1);

  const onMoveToCenter = () => {
    graph.current.fitView(40, { onlyOutOfViewPort: true, direction: 'y' });
  };

  const onZoomChange = (data: string) => {
    let toRatio = 1;
    if (data === '-') {
      toRatio = Math.max(zoom - 0.05, 0.05);
    }
    if (data === '+') {
      toRatio = Math.min(zoom + 0.05, 4);
    }
    graph.current.zoomTo(toRatio);
    graph.current.fitCenter();
    setZoom(toRatio);
  };

  const convertToPercentage = (rate: number) => {
    let percentage = Number(rate.toFixed(2)) * 100;
    if (percentage > 398) percentage = 400;
    return `${percentage.toFixed(0)}%`;
  };

  return (
    <div className="toolsRoot kw-space-between">
      <Format.Button
        type="icon"
        tip={intl.get('graphDetail.zoomIn')}
        tipPosition="top"
        onClick={() => {
          onZoomChange('-');
        }}
      >
        <MinusOutlined style={{ fontSize: 14 }} />
      </Format.Button>
      <Format.Button
        type="text-b"
        tip={intl.get('exploreGraph.resetZoom')}
        tipPosition="top"
        onClick={() => {
          onZoomChange('1');
        }}
        style={{ textAlign: 'center' }}
      >
        {convertToPercentage(zoom)}
      </Format.Button>
      <Format.Button
        type="icon"
        tip={intl.get('graphDetail.zoomOut')}
        tipPosition="top"
        onClick={() => {
          onZoomChange('+');
        }}
      >
        <PlusOutlined style={{ fontSize: 14 }} />
      </Format.Button>
      <Divider type="vertical" />
      <Format.Button type="icon" tip={intl.get('graphDetail.locate')} tipPosition="top" onClick={onMoveToCenter}>
        <IconFont type="icon-dingwei" style={{ fontSize: 14 }} />
      </Format.Button>
    </div>
  );
};

export default Tools;
