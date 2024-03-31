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
import IconFont from '@/components/IconFont';
import flow4Empty from '@/assets/images/flow4Empty.svg';
import NoDataBox from '@/components/NoDataBox';

const TabsLabel = (props: { label: string; num: number }) => {
  const { label, num } = props;
  return (
    <div className="tabsLabel">
      <Format.Text level={22}>{label}</Format.Text>
      <div className="subTitle kw-ellipsis">{HELPER.formatNumberWithComma(num)}</div>
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
  closeDrawer?: () => void;
}

const SummaryInfo = (props: SummaryInfoInterface) => {
  const { graphData, graphCount, closeDrawer } = props;
  const { nodeCount, edgeCount } = graphCount;
  const { nodes, edges } = graphData;

  return (
    <div className="summaryInfoRoot">
      <div className="content">
        <div className="header kw-pb-2 kw-space-between">
          <Format.Title level={22}>{intl.get('graphDetail.knGraphClassStatistic')}</Format.Title>
          <Format.Button
            onClick={closeDrawer}
            className="kw-c-text kw-ml-1"
            size="small"
            tip={intl.get('global.close')}
            type="icon"
          >
            <IconFont type="icon-guanbiquxiao" />
          </Format.Button>
        </div>
        {!nodeCount && !edgeCount ? (
          <div className="summaryInfoRoot-empty">
            <NoDataBox imgSrc={empty} desc={intl.get('graphDetail.noContentPleaseConfiguration')} />
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
