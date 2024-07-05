import React from 'react';
import _ from 'lodash';
import { Divider } from 'antd';
import intl from 'react-intl-universal';
import KwHeader from '@/components/KwHeader';
import IconFont from '@/components/IconFont';

export interface TopHeaderProps {
  setKnwStudio: (data: any) => void;
}

const TopHeader = (props: TopHeaderProps) => {
  const { setKnwStudio } = props;

  // 面包屑
  const breadcrumb = {
    key: 'breadcrumb',
    label: (
      <div className="kw-align-center">
        <Divider type="vertical" style={{ margin: '0px 16px' }} />
        <div className="componentIcon">
          <IconFont type="icon-color-renzhiyingyong" />
        </div>
        <div className="kw-ml-2">{intl.get('homepage.cognitiveApplication')}</div>
      </div>
    )
  };

  return <KwHeader breadcrumb={breadcrumb} onClickLogo={() => setKnwStudio('studio')} />;
};

export default TopHeader;
