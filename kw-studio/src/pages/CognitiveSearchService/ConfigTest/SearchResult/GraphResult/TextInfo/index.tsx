import React, { useRef, useEffect, useMemo } from 'react';
import intl from 'react-intl-universal';
import ScrollBar from '@/components/ScrollBar';
import cs from 'classnames';

import './style.less';

const TextInfo = (props: any) => {
  const { visible, answer = '', score, kg_name, showModalCallback, operateType, inputTitle } = props;
  const location = window.location;

  const resScrollRef = useRef<any>(null); // 搜索结果滚动容器ref

  useEffect(() => {
    if (answer) {
      resScrollRef.current?.scrollbars?.scrollToTop();
    }
  }, [answer]);

  const keepTwoDecimal = (num: any) => {
    const result = parseFloat(num);
    if (isNaN(result)) {
      return num;
    }
    return Math.round(num * 100) / 100;
  };

  const { title, subTitle } = useMemo(() => {
    return {
      title: inputTitle,
      subTitle: answer
    };
  }, [answer]);

  return (
    <div className={cs('TextInfoContainer', { previewInfo: visible })}>
      <div className="qa-title-box kw-space-between">
        <div className="qa-title kw-flex-item-full-width kw-ellipsis" title={title}>
          {title}
        </div>
        {operateType === 'qa' ? (
          <div className="kw-c-primary kw-pointer qa-subgraph" onClick={showModalCallback}>
            {intl.get('cognitiveSearch.graphQA.viewSub')}
          </div>
        ) : null}
      </div>

      <ScrollBar isshowx="false" className="res-scroll kw-mb-5" ref={resScrollRef}>
        <p className="InfoContent kw-pr-1">{subTitle}</p>
      </ScrollBar>

      <div className="InfoExtra kw-flex">
        <div className="kw-flex info-extra-left">
          {location.pathname.includes('iframe') ? null : (
            <>
              <p>
                <span className="kw-mr-2">{intl.get('cognitiveSearch.graphQA.configTitle')}</span>
                <span className="tagSep kw-mr-2">|</span>
              </p>
              <div className="kw-mr-4 kw-flex result-from">
                <span className="kw-mr-2">{intl.get('userManagement.from')}: </span>
                <div className="from kw-ellipsis" title={kg_name}>
                  {kg_name}
                </div>
              </div>
              <p>
                <span className="kw-mr-3">{intl.get('searchConfig.score')}: </span>
                <span>
                  <i>{keepTwoDecimal(score) || '--'}</i>
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextInfo;
