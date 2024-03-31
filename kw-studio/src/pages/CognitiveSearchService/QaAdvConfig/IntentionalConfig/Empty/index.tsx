import React from 'react';

import { Button } from 'antd';
import intl from 'react-intl-universal';
import emptyImg from '@/assets/images/empty.svg';

import './style.less';

const Empty = (props: any) => {
  const { setIsLargeModel, onPrev } = props;
  const desc = intl.get('cognitiveSearch.qaAdvConfig.emptyLModel');
  return (
    <div className="qa-adv-config-empty-add-large-data-root kw-h-100 kw-flex">
      <div className="kw-flex empty-box">
        <div className="kw-center">
          <img src={emptyImg} alt="" />
        </div>
        <div className="kw-center">
          <span>{desc?.split('|')[0]}</span>
          <span className="kw-c-primary kw-pointer" onClick={() => setIsLargeModel(true)}>
            {desc?.split('|')[1]}
          </span>
          <span>{desc?.split('|')[2]}</span>
        </div>
      </div>
      <div className="kw-center footer-box">
        <Button onClick={onPrev} className="kw-mr-3">
          {intl.get('global.cancel')}
        </Button>
        <Button type="primary" disabled>
          {intl.get('global.next')}
        </Button>
      </div>
    </div>
  );
};

export default Empty;
