import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import { ANALYSIS_PROPERTIES } from '@/enums';

type LabelShowType = {
  value: any;
  labelLimit: number;
  onChange: (data: any) => void;
  isBatchClass?: boolean;
};

const LabelShow = (props: LabelShowType) => {
  const { value, isBatchClass, labelLimit = 3 } = props;
  const { onChange } = props;
  const { showLabels } = value;

  const [isInit, setIsInit] = useState(true);
  const [filter, setFilter] = useState('');
  const [items, setItems] = useState(showLabels);

  useEffect(() => {
    let newItems = showLabels;
    if (filter) {
      newItems = _.filter(showLabels, item => {
        const { key, alias } = item;
        const int = ANALYSIS_PROPERTIES?.textMap[key] && intl.get(ANALYSIS_PROPERTIES.textMap[key]);
        const sort = int + alias;
        return _.includes(sort, filter);
      });
    }
    if (isBatchClass) {
      if (isInit) newItems = _.map(newItems, item => ({ ...item, isChecked: false }));
      if (newItems?.[3]?.key !== '#defaultTag') {
        newItems.splice(3, 1, {
          key: '#defaultTag',
          alias: intl.get('exploreGraph.style.defaultTag'),
          value: '',
          isChecked: false,
          isDisabled: false
        });
      }
    }
    let selectedLength = 0;
    _.forEach(newItems, item => {
      if (item?.isChecked === true) selectedLength += 1;
    });
    newItems = _.map(newItems, item => ({ ...item, isDisabled: selectedLength >= labelLimit }));
    setItems(newItems);
    setIsInit(false);
  }, [JSON.stringify(showLabels)]);

  /** 属性搜索 */
  const onChangeInput = (e: any) => {
    const value = e.target.value.trim();
    setFilter(value);
    const newItems = _.filter(showLabels, item => {
      const { key, alias } = item;
      const int = ANALYSIS_PROPERTIES?.textMap[key] && intl.get(ANALYSIS_PROPERTIES.textMap[key]);
      const sort = int + alias;
      return _.includes(sort, value);
    });
    setItems(newItems);
  };

  /** 选中属性 */
  const onUpdateShowLabels = (key: string) => (e: any) => {
    let selectedLength = 0;
    let newShowLabels = _.map(items, item => {
      const newItem = { ...item };
      if (item.key === key) newItem.isChecked = e.target.checked;
      if (newItem.isChecked === true) selectedLength += 1;
      return newItem;
    });
    newShowLabels = _.map(newShowLabels, item => ({ ...item, isDisabled: selectedLength >= labelLimit }));
    onChange({ showLabels: newShowLabels });
  };

  return (
    <div style={{ height: '100%' }}>
      <Input
        className="kw-mb-3"
        allowClear
        value={filter}
        style={{ height: 34 }}
        placeholder={intl.get('exploreGraph.style.searchAttributeName')}
        prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
        onChange={onChangeInput}
      />
      <div className="contentItems">
        {_.map(isBatchClass ? _.slice(items || [], 0, 4) : items, (item: any, index) => {
          const { alias, key, isChecked, isDisabled } = item;
          const showAlias = ANALYSIS_PROPERTIES?.textMap[key]
            ? intl.get(ANALYSIS_PROPERTIES.textMap[key])
            : alias || key;
          return (
            <div key={`${key}-${index}`} className="item">
              <Checkbox
                className="kw-mr-2"
                checked={isChecked}
                disabled={!isChecked && isDisabled}
                onChange={onUpdateShowLabels(key)}
              />
              <div className="kw-ellipsis">{showAlias}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LabelShow;
