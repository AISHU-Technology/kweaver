import { Tooltip } from 'antd';
import classNames from 'classnames';
import type { Graph } from '@antv/g6';
import intl from 'react-intl-universal';
import React, { CSSProperties } from 'react';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';

import './style.less';

interface AdG6ToolBarProps {
  className?: string;
  style?: CSSProperties;
  graph: Graph;
}

const AdG6ToolBar: React.FC<AdG6ToolBarProps> = props => {
  const { className, style, graph } = props;
  const prefixCls = 'kw-g6-toolBar';

  const fitView = () => {
    graph.fitView(20);
    graph.fitCenter();
  };
  return (
    <div className={classNames(prefixCls, className, 'kw-flex-column')} style={style}>
      <Tooltip placement="right" title={intl.get('canvas.fitView')}>
        <div className={classNames(`${prefixCls}-button`)} onClick={fitView}>
          <IconFont type="icon-fenxi" style={{ fontSize: 14 }} />
        </div>
      </Tooltip>
      <Tooltip placement="right" title={intl.get('graphDetail.zoomOut')}>
        <PlusOutlined
          className={classNames(`${prefixCls}-button ${prefixCls}-button-add`)}
          onClick={() => {
            const clientWidth = graph.getContainer().clientWidth;
            const clientHeight = graph.getContainer().clientHeight;
            let zoomValue = graph.getZoom() as number;
            zoomValue += 0.1;
            graph.zoomTo(zoomValue, { x: Math.floor(clientWidth / 2), y: Math.floor(clientHeight / 2) });
          }}
        />
      </Tooltip>
      <Tooltip placement="right" title={intl.get('graphDetail.zoomIn')}>
        <MinusOutlined
          className={classNames(`${prefixCls}-button ${prefixCls}-button-reduce`)}
          onClick={() => {
            const clientWidth = graph.getContainer().clientWidth;
            const clientHeight = graph.getContainer().clientHeight;
            let zoomValue = graph.getZoom() as number;
            zoomValue -= 0.1;
            graph.zoomTo(zoomValue, { x: Math.floor(clientWidth / 2), y: Math.floor(clientHeight / 2) });
          }}
        />
      </Tooltip>
    </div>
  );
};

export default AdG6ToolBar;
