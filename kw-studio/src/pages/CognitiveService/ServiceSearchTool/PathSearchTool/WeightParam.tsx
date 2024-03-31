import React, { useMemo } from 'react';
import { Select, InputNumber } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import classNames from 'classnames';
import Format from '@/components/Format';
import ExplainTip from '@/components/ExplainTip';
import SelectorClass from '@/components/ClassSelector';
export default function WeightParam(props: any) {
  const { className, classData, searchParams, hasNumberAttrClass, isError } = props;
  const { onChange, setIsError } = props;

  return (
    <div className={className}>
      <Format.Text className="kw-mb-2">{intl.get('exploreGraph.relationType')}</Format.Text>
      <div className="kw-w-100">
        <SelectorClass
          className={classNames('tagSelector', {})}
          data={_.find(hasNumberAttrClass, e => e?.name === searchParams?.edges)}
          entities={classData?.entity}
          type={'e_filters'}
          classList={hasNumberAttrClass}
          onChange={(data: any) => {
            onChange({ edges: data?.name });
          }}
        />
        <Format.Text className="kw-mt-5">{intl.get('exploreGraph.attr')}</Format.Text>
        <Select
          className="kw-w-100"
          value={searchParams?.property}
          onChange={e => onChange({ property: e })}
          placeholder={intl.get('global.pleaseSelect')}
        >
          {_.map(hasNumberAttrClass.find((prop: any) => prop.name === searchParams?.edges)?.properties, pro => {
            return (
              <Select.Option key={pro.name} value={pro?.name}>
                {pro?.alias || pro?.name}
              </Select.Option>
            );
          })}
        </Select>
        <Format.Text className="kw-mt-5">{intl.get('exploreGraph.defProValue')}</Format.Text>
        <ExplainTip title={intl.get('exploreGraph.defProValueTip')} />
        <InputNumber
          className="kw-w-100"
          value={searchParams?.default_value}
          placeholder={intl.get('exploreGraph.placeEnterNumber')}
          onChange={v => {
            onChange({ default_value: v });
            setIsError({ ...isError, defaultValue: false });
          }}
        />
        {isError?.defaultValue && <p className="kw-c-error">{intl.get('global.noNull')}</p>}
      </div>
    </div>
  );
}
