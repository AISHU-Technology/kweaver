import React from 'react';
import { Popconfirm } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import ExplainTip from '@/components/ExplainTip';
import IconFont from '@/components/IconFont';
import { TYPEFILTER } from '../type';
type HeaderBtnType = {
  hasTip: boolean;
  filterType: TYPEFILTER;
  searchRules: any;
  onSortProperty: () => void;
  onDeleteAll: () => void;
};
export default function HeaderBtn(props: HeaderBtnType) {
  const { hasTip, filterType, searchRules, onSortProperty, onDeleteAll } = props;

  // 所有规则组的属性是否为空，无属性条件时，按钮禁用
  const isPropertyEmpty = () => {
    if (_.isEmpty(searchRules?.[filterType])) return true;
    return _.every(searchRules?.[filterType], e => {
      if (!Array.isArray(e?.property_filters)) {
        return true; // 如果不是数组类型，则视为空数组
      }
      return e?.property_filters?.length === 0;
    });
  };

  return (
    <div className="kw-flex">
      <div className="kw-c-header">
        {intl.get('exploreGraph.ruleSet')}
        {/* 邻居配置规则需要 */}
        {!hasTip ? (
          <ExplainTip className="kw-ml-2 kw-c-subtext kw-pointer" title={intl.get('exploreGraph.ruleSetTip')} />
        ) : (
          <ExplainTip className="kw-ml-2 kw-c-subtext kw-pointer" title={intl.get('exploreGraph.relRuleSetTip')} />
        )}
      </div>
      <div
        className={classNames('hoverChange kw-mr-4 kw-ml-4 kw-pointer', { 'kw-c-watermark': isPropertyEmpty() })}
        onClick={onSortProperty}
      >
        <ExplainTip title={intl.get('exploreGraph.ruleSortTip')}>
          <IconFont type="icon-paixu11" className="kw-pr-2" />
          {intl.get('exploreGraph.sortPro')}
        </ExplainTip>
      </div>
      <Popconfirm
        placement="topRight"
        title={intl.get('exploreGraph.deleteAllGroup')}
        onConfirm={onDeleteAll}
        okText={intl.get('global.ok')}
        cancelText={intl.get('global.cancel')}
        disabled={_.isEmpty(searchRules?.[filterType])}
        getPopupContainer={e => e.parentElement || document.body}
      >
        <div
          className={classNames('hoverChange kw-mr-2 kw-ml-2 kw-pointer', {
            'kw-c-watermark': _.isEmpty(searchRules?.[filterType])
          })}
        >
          <IconFont type="icon-lajitong" className="kw-pr-2" />
          {intl.get('exploreGraph.clear')}
        </div>
      </Popconfirm>
    </div>
  );
}
