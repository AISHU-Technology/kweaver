import { Tooltip } from 'antd';
import classNames from 'classnames';
import type { Graph } from '@antv/x6';
import intl from 'react-intl-universal';
import React, { CSSProperties } from 'react';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';
import { KwX6DataFileNode } from '@/components/KwReactX6/utils/constants';

import './style.less';

interface KwG6ToolBarProps {
  graph: Graph;
  className?: string;
  style?: CSSProperties;
}

const KwX6ToolBar: React.FC<KwG6ToolBarProps> = props => {
  const { className, style, graph } = props;
  const prefixCls = 'kw-x6-toolBar';

  const fitView = () => {
    const allNodes = graph.getNodes().find(node => node.toJSON().shape === KwX6DataFileNode);
    const dom = document.querySelector(`g[data-cell-id="${allNodes?.toJSON().id}"]`);
    if (dom) {
      graph.zoomToFit({ maxScale: 1, preserveAspectRatio: true });
    } else {
      graph.zoomToFit({ maxScale: 1, preserveAspectRatio: true });
    }
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
            let zoomValue = graph.zoom() as number;
            zoomValue += 0.1;
            graph.zoomTo(zoomValue);
          }}
        />
      </Tooltip>
      <Tooltip placement="right" title={intl.get('graphDetail.zoomIn')}>
        <MinusOutlined
          className={classNames(`${prefixCls}-button ${prefixCls}-button-reduce`)}
          onClick={() => {
            let zoomValue = graph.zoom() as number;
            zoomValue -= 0.1;
            graph.zoomTo(zoomValue);
          }}
        />
      </Tooltip>
    </div>
  );
};

export default KwX6ToolBar;
