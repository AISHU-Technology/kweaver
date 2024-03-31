import React from 'react';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { Checkbox, Popconfirm, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';

import './style.less';
import ExplainTip from '@/components/ExplainTip';
type TypeSearchRuleProps = {
  ruleItemClass?: any;
  searchRules: any;
  checkedRules?: any[];
  hasTip?: boolean; // 删除、编辑tip
  allowcheck?: boolean; // 点击行允许勾选/取消勾选
  checkable?: boolean; // 是否显示复选框
  onEdit: (data: any) => void;
  onDelete: (data: any) => void;
  onCheckRule?: (name: string, checked: boolean) => void;
};
const SearchRuleList = (props: TypeSearchRuleProps) => {
  const {
    searchRules,
    checkedRules,
    hasTip = true,
    allowcheck,
    checkable = true,
    ruleItemClass,
    onEdit,
    onDelete,
    onCheckRule
  } = props;
  const onClickItem = (item: any) => {
    if (allowcheck) {
      const checked = _.includes(checkedRules, item?.name) || item?.checked;
      onCheckRule?.(item?.name, !checked);
    }
  };
  return (
    <div className="searchRulesListWrapper">
      {_.isEmpty(searchRules) ? (
        <p className="kw-c-watermark kw-mt-8 kw-content-center ">{intl.get('exploreGraph.noRules')}</p>
      ) : (
        <div>
          {_.map(searchRules, (ruleItem, index) => {
            const { error, name, checked } = ruleItem || {};
            return (
              <div
                key={index}
                className={classNames(ruleItemClass, 'ruleItem kw-space-between kw-pointer')}
                onClick={() => onClickItem(ruleItem)}
              >
                <div className="kw-align-center">
                  {checkable && (
                    <Checkbox
                      checked={_.includes(checkedRules, name) || checked}
                      onChange={e => onCheckRule?.(name, e.target.checked)}
                      onClick={e => e.stopPropagation()}
                    />
                  )}

                  <div className={classNames('kw-ellipsis kw-ml-2 ruleName', { isError: error })} title={name}>
                    {name}
                  </div>
                </div>
                <div className="kw-align-center">
                  {error && (
                    <ExplainTip title={intl.get('exploreGraph.deletedRelation')}>
                      <ExclamationCircleOutlined className="kw-c-error errorIcon" />
                    </ExplainTip>
                  )}
                  <div className="ruleTool kw-ml-3" onClick={e => e.stopPropagation()}>
                    <Tooltip title={hasTip ? intl.get('global.edit') : ''}>
                      <IconFont type="icon-edit" className="kw-pointer" onClick={() => onEdit(ruleItem)} />
                    </Tooltip>
                    <Popconfirm
                      placement="topRight"
                      title={intl.get('exploreGraph.deleterules')}
                      onConfirm={() => onDelete(name)}
                      okText={intl.get('global.ok')}
                      cancelText={intl.get('global.cancel')}
                      zIndex={1052}
                    >
                      <Tooltip title={hasTip ? intl.get('global.delete') : ''}>
                        <IconFont type="icon-lajitong" className="kw-ml-3 kw-pointer" />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default SearchRuleList;
