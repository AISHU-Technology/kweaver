import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';

import './index.less';

const ExploreLoadTip = (props: any) => {
  const { hasCancel = true, cancelOperation } = props;
  const onCancel = () => {
    cancelOperation();
  };

  return (
    <div className="explore-graph-top-loading-tips">
      <Spin indicator={<LoadingOutlined style={{ fontSize: 20, color: '#000' }} spin />} />
      <span className="kw-ml-2 kw-mr-3">{intl.get('searchGraph.loadingTip')}</span>

      {hasCancel && (
        <span className="kw-pointer kw-ml-9 kw-c-subtext" onClick={onCancel}>
          {intl.get('exploreGraph.cancelOperation')}
        </span>
      )}
    </div>
  );
};
export default ExploreLoadTip;
