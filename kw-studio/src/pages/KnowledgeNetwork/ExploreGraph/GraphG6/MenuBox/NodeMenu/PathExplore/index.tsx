import React from 'react';
import intl from 'react-intl-universal';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

import './style.less';

const PathExplore = (props: any) => {
  const { onCloseMenu, onSetStartNode, onChangeGraphMode, onOpenLeftDrawer } = props;

  const onSelectDirection = (dir: string) => {
    onCloseMenu();
    onSetStartNode(dir);
    onChangeGraphMode('addEdge');
  };
  return (
    <div className="pathExploreModal">
      <div className="tipTitle kw-align-center">
        <div className="kw-c-subtext">
          {intl.get('exploreGraph.shortPath')}
          <Tooltip title={intl.get('exploreGraph.degree')}>
            <QuestionCircleOutlined className="kw-ml-2" />
          </Tooltip>
        </div>
      </div>
      <div className="pathItem kw-align-center" onClick={() => onSelectDirection('positive')}>
        {intl.get('exploreGraph.positive')}
      </div>
      <div className="pathItem kw-align-center" onClick={() => onSelectDirection('reverse')}>
        {intl.get('exploreGraph.reverse')}
      </div>
      <div className="pathItem kw-align-center" onClick={() => onSelectDirection('bidirect')}>
        {intl.get('exploreGraph.allPosition')}
      </div>
      <div
        className="more-op kw-align-center kw-border-t"
        onClick={() => {
          onOpenLeftDrawer('path');
          onCloseMenu();
        }}
      >
        {intl.get('exploreGraph.more')}
      </div>
    </div>
  );
};
export default PathExplore;
