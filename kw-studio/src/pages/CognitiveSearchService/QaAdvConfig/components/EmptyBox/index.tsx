import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import configEmpty from '@/assets/images/strategyEmpty.svg';
import empty from '@/assets/images/empty.svg';
import intentEmpty from '@/assets/images/intentEmpty.svg';
import noResImg from '@/assets/images/noResult.svg';

import './style.less';
import NoData from '@/components/NoDataBox/NoData';

const ParamEmpty = (props: any) => {
  const { desc } = props;
  return (
    <div className="advConfigEmptyTip">
      <img src={empty} />
      <div className="full-tip">{desc}</div>
    </div>
  );
};

const EmptyBox = (props: any) => {
  const { desc, img } = props;
  const tipContent = [
    intl.get('cognitiveSearch.qaAdvConfig.testSmodelTip1'),
    intl.get('cognitiveSearch.qaAdvConfig.testSmodelTip2')
  ];
  return (
    <div className="advConfigEmptyTip">
      <img src={configEmpty} />
      <div className="full-tip">
        {_.map(tipContent, (item: any, index: any) => {
          return (
            <div key={index} className="tip-content kw-c-subtext">
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EmptyIntention = (props: any) => {
  const { onCreate } = props;
  return (
    <div className="advConfigEmptyTip" style={props?.style}>
      <img src={intentEmpty} />
      <div className="full-tip">
        <span>{intl.get('cognitiveSearch.qaAdvConfig.clickAdd').split('|')[0]}</span>
        <span className="kw-c-primary kw-pointer" onClick={onCreate}>
          {intl.get('cognitiveSearch.qaAdvConfig.clickAdd').split('|')[1]}
        </span>
        <span>{intl.get('cognitiveSearch.qaAdvConfig.clickAdd').split('|')[2]}</span>
      </div>
    </div>
  );
};

const NoResultWrapper = (props: any) => {
  return <NoData {...props} imgSrc={noResImg} desc={intl.get('global.noResult')} />;
};

export default EmptyBox;
export { ParamEmpty, EmptyIntention, NoResultWrapper };
