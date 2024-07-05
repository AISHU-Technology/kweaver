/**
 * 同义词列表组件
 */
import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Input, InputRef } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import './style.less';

type VerifyOptions = { type?: 'node' | 'edge'; index?: number; total?: any[] };
/**
 * 校验单个
 */
export const verifySynonymItem = (value: string, options?: VerifyOptions) => {
  if (!value) return intl.get('global.noNull');
  if (value?.length > 255) {
    return intl.get('global.lenErr', { len: 255 });
  }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
    return intl.get('global.onlyNormalName');
  }
  if (options) {
    if (_.some(options.total, (d, i) => d.value === value && i !== options.index)) {
      return intl.get('global.repeatName');
    }
  }

  return '';
};

/**
 * 校验所有
 */
const verifyAllSynonym = (data: { value: string; error?: string }[], type: 'node' | 'edge') => {
  const errorFields: any[] = [];
  const valueMap: Record<string, boolean> = {};
  const newData = _.map(data, (d, i) => {
    const clone = { ...d };
    clone.error = verifySynonymItem(clone.value);
    if (!clone.error && valueMap[clone.value]) {
      clone.error = intl.get('global.repeatName');
    }
    valueMap[clone.value] = true;
    clone.error && errorFields.push({ name: ['synonym' + i], errors: [clone.error] });
    return clone;
  });
  return { data: newData, errorFields };
};

export interface SynonymsListProps {
  className?: string;
  style?: React.CSSProperties;
  type: 'node' | 'edge';
  data: { value: string; error?: string }[];
  readOnly?: boolean;
  onChange?: (data: { value: string; error?: string }[]) => void;
}

const SynonymsList = (props: SynonymsListProps, ref: any) => {
  const { className, style, type = 'node', data, readOnly, onChange } = props;

  const inputFirst = useRef<InputRef>(null);

  useImperativeHandle(ref, () => ({
    /**
     * 触发全部校验
     */
    validateFields: async () => {
      const { data: verifiedData, errorFields } = verifyAllSynonym(data, type);
      onChange?.(verifiedData);
      if (_.isEmpty(errorFields)) {
        return Promise.resolve(verifiedData);
      }
      return Promise.reject({ values: verifiedData, errorFields });
    }
  }));

  useEffect(() => {
    if (inputFirst) {
      setTimeout(() => {
        inputFirst.current?.focus();
      }, 0);
    }
  }, [data]);

  const handleChange = (value: string, index: number) => {
    const newData = [...data];
    newData[index].value = value;
    newData[index].error = verifySynonymItem(value, { type, index, total: newData });
    onChange?.(newData);
  };

  const handleDelete = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    const { data: verifiedData } = verifyAllSynonym(newData, type);
    onChange?.(verifiedData);
  };

  return (
    <div className={classNames(className, 'onto-synonyms-list')} style={style}>
      {_.map(data, (item, index: number) => (
        <div key={String(index)} className="word-row kw-flex kw-mb-3">
          <div
            className={classNames('del-icon kw-mr-2 kw-pointer', { disabled: readOnly })}
            onClick={() => !readOnly && handleDelete(index)}
          >
            <IconFont type="icon-del" />
          </div>

          <div className="input-wrap">
            <Input
              ref={item.value === '' ? inputFirst : null}
              className={classNames({ 'error-border': item.error })}
              placeholder={intl.get('global.pleaseEnter')}
              disabled={readOnly}
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

export default forwardRef(SynonymsList);
