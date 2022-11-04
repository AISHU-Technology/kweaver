import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Tabs } from 'antd';

import HELPER from '@/utils/helper';
import Format from '@/components/Format';
import NodesList from './NodesList';
import EdgesList from './EdgesList';

import empty from '@/assets/images/empty.svg';
import './style.less';

const TabsLabel = (props: { label: string; num: number }) => {
  const { label, num } = props;
  return (
    <div className="tabsLabel">
      <Format.Text level={22}>{label}</Format.Text>
      <div className="subTitle ad-ellipsis">{HELPER.formatNumberWithComma(num)}</div>
    </div>
  );
};

interface SummaryInfoInterface {
  graphData: {
    nodes: any;
    edges: any;
  };
  graphCount: {
    nodeCount: number;
    edgeCount: number;
  };
}

const SummaryInfo = (props: SummaryInfoInterface) => {
  const { graphData, graphCount } = props;
  const { nodeCount, edgeCount } = graphCount;
  const { nodes, edges } = graphData;

  return (
    <div className="summaryInfoRoot">
      <div className="content ad-p-5 ad-pt-4">
        <div className="header ad-pb-2">
          <Format.Title level={22}>{intl.get('graphDetail.kgOverview')}</Format.Title>
        </div>
        {!nodeCount && !edgeCount ? (
          <div className="empty">
            <img className="ad-mb-2" src={empty} />
            <Format.Text style={{ textAlign: 'center' }}>
              {intl.get('graphDetail.noContentPleaseConfiguration')}
            </Format.Text>
          </div>
        ) : (
          <Tabs className="tabs" centered moreIcon={null} defaultActiveKey="1">
            <Tabs.TabPane key="1" tab={<TabsLabel label={intl.get('graphDetail.vertex')} num={nodeCount} />}>
              <NodesList items={nodes} />
            </Tabs.TabPane>
            <Tabs.TabPane key="2" tab={<TabsLabel label={intl.get('graphDetail.edges')} num={edgeCount} />}>
              <EdgesList items={edges} />
            </Tabs.TabPane>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default (props: any) => {
  const { isShow, ...other } = props;
  if (!isShow) return null;
  return <SummaryInfo {...other} />;
};
