import React from 'react';
import { Select } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import RequireLabel from '../RequireLabel';
import SelectorEmpty from '../SelectorEmpty';
import './style.less';
import { Properties } from '../../../types';

export interface PropertyListProps {
  className?: string;
  showErr?: boolean;
  values: Properties[];
  properties: Properties[];
  onChange?: (newData: Properties[]) => void;
}

const PropertyList = (props: PropertyListProps) => {
  const { className, showErr, properties, values, onChange } = props;

  /**
   * 值变化
   */
  const handleChange = (pro: Properties, index: number) => {
    if (!pro) return;
    const newValues = [...values];
    newValues[index] = pro;
    onChange?.(newValues);
  };

  /**
   * 删除
   */
  const handleDelete = (index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange?.(newValues);
  };

  /**
   * 添加
   */
  const handleAdd = () => {
    if (values.length >= 8) return;
    onChange?.([...values, { name: '', alias: '', type: '' }]);
  };

  return (
    <div className={classNames(className, 'knw-card-property')}>
      {_.map(values, (value, index) => (
        <React.Fragment key={value.name + index}>
          <RequireLabel label={`${intl.get('knowledgeCard.attribute')}${index + 1}`} />
          <div className="kw-align-center">
            <Select
              className={classNames('kw-flex-item-full-width', { 'error-selector': showErr })}
              placeholder={intl.get('global.pleaseSelect')}
              showSearch
              optionFilterProp="label"
              value={value.name || undefined}
              onChange={(v, option: any) => handleChange(option.data, index)}
              notFoundContent={<SelectorEmpty />}
            >
              {_.map(properties, pro => (
                <Select.Option key={pro.name} data={pro} label={pro.alias}>
                  {pro.alias}
                </Select.Option>
              ))}
            </Select>
            <IconFont
              className={classNames('kw-ml-3 kw-mr-4 kw-pointer', { 'del-disabled': values.length === 1 })}
              type="icon-lajitong"
              onClick={() => values.length > 1 && handleDelete(index)}
            />
          </div>
          <div className="kw-c-error" style={{ minHeight: 16 }}>
            {showErr && !value.name && intl.get('global.pleaseSelect')}
          </div>
        </React.Fragment>
      ))}
      <div
        className={classNames(values.length < 8 ? 'kw-c-primary' : 'kw-c-watermark')}
        style={{ display: 'inline-block', cursor: values.length < 8 ? 'pointer' : 'not-allowed', userSelect: 'none' }}
        onClick={handleAdd}
      >
        <IconFont type="icon-Add" className="kw-mr-2" />
        {intl.get('global.add')}
      </div>
    </div>
  );
};

export default PropertyList;
