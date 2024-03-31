import React from 'react';
import ComposInput from '@/components/ComposInput';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';

import IconFont from '@/components/IconFont';
import { FormValidator } from '@/utils/handleFunction';

const validator = new FormValidator([
  { required: true, message: intl.get('global.noNull') },
  { max: 50, message: intl.get('global.lenErr', { len: 50 }) }
]);
export const verifyOption = (value: string) => {
  return validator.verify(value);
};
export const verifyAllOptions = (values: Record<string, string>[]) => {
  let isErr = false;
  const newData = _.map(values, (d, i) => {
    const clone = { ...d };
    clone.error = verifyOption(clone.value);
    clone.error && (isErr = true);
    return clone;
  });
  return { data: newData, isErr };
};

export interface OptionListProps {
  className?: string;
  values?: Record<string, string>[];
  onChange?: (values: Record<string, string>[]) => void;
}

const OptionList = (props: any) => {
  const { className, values = [], onChange } = props;

  const handleChange = (value: string, index: number) => {
    const newData = [...values];
    newData[index].value = value;
    newData[index].error = verifyOption(value);
    onChange?.(newData);
  };

  const handleDelete = (index: number) => {
    if (isDisabledDelete()) return;
    const newData = [...values];
    newData.splice(index, 1);
    onChange?.(newData);
  };

  const isDisabledDelete = () => {
    return values.length < 2;
  };

  return (
    <div className={classNames(className, 'options-list')}>
      {_.map(values, (item, index: number) => (
        <div key={String(index)} className="option-row kw-flex kw-mb-3">
          <div
            className="del-icon kw-mr-2"
            style={isDisabledDelete() ? { cursor: 'not-allowed', opacity: 0.45 } : { cursor: 'pointer' }}
            onClick={() => handleDelete(index)}
          >
            <IconFont type="icon-del" />
          </div>

          <div className="input-wrap">
            <ComposInput
              useAntd
              className={classNames({ 'error-border': item.error })}
              value={item.value}
              onChange={e => handleChange(e.target.value.trim(), index)}
            />
            {item.error && <div className="err-msg">{item.error}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OptionList;
