import React from 'react';
import _ from 'lodash';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import fileGraph from '@/assets/images/fileGraph.svg';
import fullTip from '@/assets/images/fullTip.svg';
import { tipContent } from '../../enum';

import './style.less';

const AllClassify = (props: any) => {
  const { authData, isVisible, fullContent, onShowGraphMessage } = props;

  const isAuthError = (data: any) => {
    if (!authData?.checked) return false;
    const includes = _.every(data?.kgs, item => _.includes(authData?.data, String(item?.kg_id)));
    return !includes;
  };

  return (
    <>
      {isVisible ? (
        <div className="kw-flex kw-h-100 kw-w-100 graph-under-certain-category">
          <div className="range-left-box kw-pt-5">
            <div className="kw-pl-6 kw-flex classify-title">
              <IconFont type="icon-ziyuanfenlei" />
              <div className="source-classify">{intl.get('cognitiveSearch.classify.resources')}</div>
            </div>
            {_.map(fullContent, (item: any) => {
              return (
                <div
                  className="kw-flex file-message kw-pointer"
                  key={item?.class_id}
                  onClick={() => onShowGraphMessage(item, 'concrete')}
                >
                  {item?.class_id === 1 ? (
                    <IconFont type="icon-putongwenjianjia" style={{ fontSize: '16px' }} />
                  ) : (
                    <img src={fileGraph} alt="" className="file-icon" />
                  )}

                  <div
                    className="file-content kw-ellipsis kw-mr-3"
                    title={
                      item?.class_name === '全部资源'
                        ? intl.get('cognitiveSearch.classify.allResource')
                        : item?.class_name
                    }
                  >
                    {item?.class_name === '全部资源'
                      ? intl.get('cognitiveSearch.classify.allResource')
                      : item?.class_name}
                  </div>
                  {/* 错误按钮 */}
                  {isAuthError(item) && (
                    <ExplainTip title={intl.get('global.graphNoPeromission')}>
                      <ExclamationCircleOutlined className="kw-c-error kw-mr-2" />
                    </ExplainTip>
                  )}
                  <IconFont type="icon-fanye" />
                </div>
              );
            })}
          </div>
          <div className="range-right-box kw-center">
            <img src={fullTip} className="kw-mr-8" />
            <div className="kw-flex full-tip">
              {_.map(tipContent, (item: any, index: any) => {
                return (
                  <div key={index} className="tip-content kw-c-subtext">
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AllClassify;
