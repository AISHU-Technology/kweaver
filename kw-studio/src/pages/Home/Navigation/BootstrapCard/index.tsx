import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Col, Button } from 'antd';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';

import modelFactory from '@/assets/images/modelFactory.png';
import knowledgeNetwork from '@/assets/images/knowledgeNetwork.png';
import cognitiveApplication from '@/assets/images/cognitiveApplication.png';

import './style.less';

const BACK_IMAGE: any = {
  modelFactory,
  knowledgeNetwork,
  cognitiveApplication
};

const BootstrapCard = (props: any) => {
  const { dec, icon, title, backImage } = props;
  const { onClick } = props;

  return (
    <Col xl={12} md={12} sm={12} xs={24}>
      <div className="bootstrapCard" onClick={onClick}>
        <div style={{ height: 116, position: 'relative' }}>
          <img src={BACK_IMAGE[backImage]} style={{ width: '100%', height: '100%' }} />
          <IconFont type={icon} className="bootstrapIcon" />
        </div>
        <div className="introduction">
          <div>
            <Format.HeaderTitle level={14}>{title}</Format.HeaderTitle>
            <Format.HeaderText level={14} block className="kw-mt-2 kw-c-text kw-ellipsis-2">
              {dec}
            </Format.HeaderText>
          </div>
          <Button type="link" className="button">
            {intl.get('homepage.getStarted2')} <IconFont type="icon-fanye" style={{ fontSize: 10 }} />
          </Button>
        </div>
      </div>
    </Col>
  );
};

export default BootstrapCard;
