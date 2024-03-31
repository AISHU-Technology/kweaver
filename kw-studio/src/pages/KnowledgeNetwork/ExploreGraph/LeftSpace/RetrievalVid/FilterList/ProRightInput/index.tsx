import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Input, DatePicker as DateInput, InputNumber, Select, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import { proType } from './type';

const DatePicker: any = DateInput;
const RangePicker: any = DatePicker.RangePicker;
const ProRightInput = (props: any) => {
  const { type, rangeType, changeOpValue } = props;
  const [opValue, setOpValue] = useState<any>('');

  useEffect(() => {
    changeOpValue(rangeType, opValue);
  }, [rangeType, opValue]);

  // 切换值
  const onChangeValue = (num: 'one' | 'two', value: any, index?: number) => {
    if (num === 'one') {
      setOpValue(value);
    } else {
      if (index === undefined) return;
      // 时间
      if (index === 2) return setOpValue(value);
      const a = _.isArray(opValue) ? _.cloneDeep(opValue) : [];
      a[index] = value;
      setOpValue(a);
    }
  };

  return (
    <div className="kw-mt-2">
      {/* 条件值 */}
      <div className="kw-align-center">
        {/* string */}
        {_.includes(proType.str, type) && (
          <Input
            className="kw-w-100"
            value={opValue}
            onChange={e => {
              onChangeValue('one', e?.target?.value);
            }}
          />
        )}

        {/* 数字 */}
        {_.includes(proType?.number, type) && (
          <>
            {rangeType === 'btw' ? (
              <div className="kw-w-100 kw-space-between">
                <InputNumber
                  className="kw-w-100"
                  value={opValue?.[0]}
                  onChange={e => {
                    onChangeValue('two', e, 0);
                  }}
                />
                <span className="kw-mr-2 kw-ml-2"> ~ </span>
                <InputNumber
                  className="kw-w-100"
                  value={opValue?.[1]}
                  onChange={e => {
                    onChangeValue('two', e, 1);
                  }}
                />
              </div>
            ) : (
              <InputNumber
                className="kw-w-100"
                value={opValue}
                onChange={e => {
                  onChangeValue('one', e);
                }}
              />
            )}
          </>
        )}

        {/* Boolean */}
        {_.includes(proType?.bool, type) && (
          <Select
            className="kw-w-100"
            value={opValue}
            onChange={e => {
              onChangeValue('one', e);
            }}
          >
            <Select.Option value={'True'}>True</Select.Option>
            <Select.Option value={'False'}>False</Select.Option>
          </Select>
        )}

        {/* 时间 */}
        {_.includes(proType?.date, type) && (
          <>
            {rangeType === 'btw' ? (
              <RangePicker
                className="kw-w-100"
                separator={intl.get('search.to')}
                suffixIcon={<IconFont type="icon-datetime-date" />}
                onChange={(_: any, data: any) => onChangeValue('two', data, 2)}
              />
            ) : (
              <DatePicker
                className="kw-w-100"
                suffixIcon={<IconFont type="icon-datetime-date" />}
                onChange={(_: any, data: any) => onChangeValue('one', data)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default ProRightInput;
