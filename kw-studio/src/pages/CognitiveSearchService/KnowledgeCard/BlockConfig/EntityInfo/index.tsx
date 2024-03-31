import React, { useState, useMemo } from 'react';
import { Select, Divider } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import RequireLabel from '../components/RequireLabel';
import PropertyList from '../components/PropertyList';
import ColorDropDown from '../components/ColorDropDown';
import Header from '../components/Header';
import './style.less';

import { EntityInfoType } from '../../types';

export interface EntityInfoProps {
  className?: string;
  node: Record<string, any>;
  data: EntityInfoType;
  onChange: (newData: Partial<EntityInfoType>) => void;
}

const EntityInfo = (props: EntityInfoProps) => {
  const { className, node, data, onChange } = props;
  const options = useMemo(() => {
    return _.map(node?.properties, pro => ({ value: pro.name, label: pro.alias }));
  }, [node]);
  const [colorType, setColorType] = useState<'inherit' | 'custom'>(
    data.labelColor === 'inherit' ? 'inherit' : 'custom'
  );

  /**
   * 修改配色方案
   */
  const onColorTypeChange = (type: 'inherit' | 'custom') => {
    setColorType(type);
    if (type === 'inherit') {
      onChange({ labelColor: 'inherit' });
    } else {
      onChange({ labelColor: 'rgba(18, 110, 227, 1)' });
    }
  };

  /**
   * 修改属性
   * @param proList
   */
  const onProChange = (proList: EntityInfoType['properties']) => {
    const data: Partial<EntityInfoType> = { properties: proList };
    if (!_.some(proList, pro => !pro.name)) {
      data.error = _.omit(data.error, 'properties');
    }
    onChange(data);
  };

  return (
    <div className={classNames(className, 'knw-card-entity-info kw-flex-column kw-h-100')}>
      <Header title={intl.get('knowledgeCard.componentConfig')} />
      <div className="kw-pl-6 kw-pr-6">
        <RequireLabel className="kw-mt-6" label={intl.get('knowledgeCard.titlePro')} />
        <Select
          className="kw-w-100"
          placeholder={intl.get('global.pleaseSelect')}
          showSearch
          optionFilterProp="label"
          options={options}
          value={data.title || undefined}
          onChange={v => {
            onChange({ title: v });
          }}
        />
        <RequireLabel className="kw-mt-5" label={intl.get('knowledgeCard.tagColor')} />
        <div className="kw-flex">
          <Select className="kw-flex-item-full-width kw-w-100" value={colorType} onChange={onColorTypeChange}>
            <Select.Option key="inherit">{intl.get('knowledgeCard.entityColor')}</Select.Option>
            <Select.Option key="custom">{intl.get('knowledgeCard.custom')}</Select.Option>
          </Select>
          <ColorDropDown
            className=" kw-ml-2"
            color={data.labelColor === 'inherit' ? node.color : data.labelColor}
            disabled={colorType === 'inherit'}
            onChange={color => onChange({ labelColor: color.rgba })}
          />
        </div>
        <RequireLabel className="kw-mt-5" label={intl.get('knowledgeCard.descPro')} />
        <Select
          className={classNames('kw-w-100', { 'error-selector': !!data.error?.description })}
          placeholder={intl.get('global.pleaseSelect')}
          showSearch
          optionFilterProp="label"
          options={options}
          value={data.description || undefined}
          onChange={v => {
            onChange({ description: v, error: _.omit(data.error, 'description') });
          }}
        />
        <div className="kw-c-error" style={{ minHeight: 20 }}>
          {data.error?.description}
        </div>
      </div>
      <Divider dashed style={{ width: 'calc(100% - 24px * 2)', minWidth: 0, margin: '0 24px 20px' }} />
      <div className="kw-flex-item-full-height kw-pb-5" style={{ overflow: 'auto' }}>
        <PropertyList
          showErr={!!data.error?.properties}
          values={data.properties}
          properties={node?.properties}
          onChange={onProChange}
        />
      </div>
    </div>
  );
};

export default EntityInfo;
