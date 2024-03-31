import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button, Checkbox } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import SearchInput from '@/components/SearchInput';
import classNames from 'classnames';
import { fuzzyMatch } from '@/utils/handleFunction';
import { NoResultWrapper } from '../../components/EmptyBox';

import './style.less';
import ExplainTip from '@/components/ExplainTip';

export default function LeftIntention(props: any) {
  const { gaConfigData, currentIntention, onChangeIntent, onClear } = props;
  const [selected, setSelected] = useState<any[]>([]); // 勾选的意图名
  const [showList, setShowList] = useState<any[]>();

  useEffect(() => {
    setShowList(gaConfigData);
  }, [gaConfigData]);

  /** 全选 */
  const onSelectedAll = (e: any) => {
    if (!e?.target?.checked) return setSelected([]);
    const names = _.map(gaConfigData, item => item?.intent_name);
    setSelected(names);
  };

  /** 勾选 */
  const onChecked = (e: any, item: any) => {
    const { checked } = e?.target;
    if (checked) setSelected(pre => [item?.intent_name, ...pre]);
    if (!checked) setSelected(pre => _.filter(pre, s => s !== item?.intent_name));
  };

  /** 搜索 */
  const onSearch = _.debounce(value => {
    const data = _.filter(gaConfigData, item => fuzzyMatch(value, item?.intent_name));
    setShowList(data);
  }, 200);
  return (
    <div className="qaConfigIntentListRoot">
      <div style={{ height: 'calc(100% - 32px)' }}>
        <Format.Title className="kw-mb-3">{intl.get('cognitiveSearch.qaAdvConfig.intPoolName')} </Format.Title>
        <SearchInput
          style={{ width: '100%' }}
          placeholder={intl.get('cognitiveSearch.qaAdvConfig.searchIntent')}
          onChange={e => {
            e?.persist();
            onSearch(e?.target?.value);
          }}
        />
        <div className="intentListWrapper kw-pt-3 kw-pb-3">
          {_.isEmpty(showList) ? (
            <NoResultWrapper style={{ marginTop: 120 }} />
          ) : (
            _.map(showList, item => {
              const selectedBg = item?.intent_name === currentIntention?.intent_name;
              return (
                <div
                  key={item?.intent_name}
                  className={classNames('intentionItem kw-align-center', { selectedBg })}
                  onClick={() => onChangeIntent(item)}
                >
                  <Checkbox
                    className="kw-mr-2"
                    checked={_.includes(selected, item?.intent_name)}
                    onChange={e => onChecked(e, item)}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="kw-flex-item-full-width kw-ellipsis" title={item?.intent_name}>
                    {item?.intent_name}
                  </div>
                  <div>
                    {item?.error && (
                      <ExplainTip title={intl.get('cognitiveSearch.qaAdvConfig.invalidGraph')}>
                        <ExclamationCircleFilled className="kw-c-error kw-mr-2" />
                      </ExplainTip>
                    )}
                    {item?.complete_config && (
                      <IconFont type="icon-duigou" className="kw-c-primary" style={{ fontSize: 20 }} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="kw-space-between">
        <Checkbox
          onClick={onSelectedAll}
          indeterminate={!!selected.length && selected.length < gaConfigData?.length}
          checked={selected.length === gaConfigData?.length && selected.length !== 0}
        >
          {intl.get('global.checkAll')}
        </Checkbox>
        <Button onClick={() => onClear(selected)} disabled={selected?.length === 0}>
          {intl.get('cognitiveSearch.qaAdvConfig.clear')}
        </Button>
      </div>
    </div>
  );
}
