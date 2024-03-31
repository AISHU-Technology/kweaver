import React, { useEffect, useRef } from 'react';
import { Button, Select } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import intl from 'react-intl-universal';

import ComposInput from '@/components/ComposInput';

import VarNumberInput from '../VarNumberInput';
import { formatNumber } from '../../utils';
import { TVariables } from '../../types';
import './style.less';
import { isDef } from '@/utils/handleFunction';

export interface VariableInputProps {
  className?: string;
  variables: TVariables;
  varInputData: Record<string, any>;
  disabled?: boolean;
  type: 'chat' | 'completion' | string;
  onChange: (value: Record<string, string>) => void;
  onRun?: () => void;
  onRestart?: () => void;
}

/**
 * 变量的输入框列表
 */
const VariableInput = (props: VariableInputProps) => {
  const { className, type, variables, varInputData, disabled } = props;
  const { onChange, onRun, onRestart } = props;
  const containerDOM = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCorrectValue();
  }, [variables]);

  /**
   * 变量类型变化, 对变量值进行矫正
   * 同步修改, 无需监听varInputData
   */
  const setCorrectValue = () => {
    try {
      const newValue: any = {};
      _.forEach(variables, item => {
        let value = varInputData[item.id];
        if (!isDef(value)) return;
        if (item.field_type === 'text') {
          value = String(value);
          if (value.length > item.max_len!) {
            value = value.slice(0, item.max_len!);
          }
        }
        if (item.field_type === 'textarea') {
          value = String(value);
        }
        if (item.field_type === 'selector') {
          value = String(value);
          if (!_.includes(item.options, value)) {
            value = undefined;
          }
        }
        if (item.field_type === 'number') {
          if (typeof value !== 'number') {
            value = undefined;
          } else if (item.range?.[0] && value < item.range[0]) {
            value = item.range[0];
          } else if (item.range?.[1] && value > item.range[1]) {
            value = item.range[1];
          }
        }
        value !== varInputData[item.id] && (newValue[item.id] = value);
      });
      !_.isEmpty(newValue) && onChange?.({ ...varInputData, ...newValue });
    } catch {
      //
    }
  };

  const handleChange = (key: string, value: any) => {
    onChange({ ...varInputData, [key]: value });
  };

  const renderComponent = (item: TVariables[number]) => {
    const { id, field_type, max_len, options, value_type, range = [] } = item;
    const key = id + field_type;
    if (field_type === 'number') {
      const [min, max] = range;
      return (
        <VarNumberInput
          key={key}
          className="kw-w-100"
          value={varInputData[id]}
          min={formatNumber(min)}
          max={formatNumber(max)}
          precision={value_type === 'i' ? 0 : undefined}
          onChange={value => handleChange(id, value)}
        />
      );
    }
    if (field_type === 'selector') {
      const optionsProps = _.map(options, o => ({ key: o, value: o, label: o }));
      const value = _.includes(options, varInputData[id]) ? varInputData[id] : '';
      return (
        <Select
          key={key}
          className="kw-w-100"
          placeholder={intl.get('global.pleaseSelect')}
          value={value}
          options={optionsProps}
          getPopupContainer={() => containerDOM.current || document.body}
          onChange={value => handleChange(id, value)}
        />
      );
    }
    if (field_type === 'text') {
      return (
        <ComposInput
          key={key}
          value={varInputData[id]}
          useAntd
          showCount
          maxLength={max_len}
          onChange={e => handleChange(id, e.target.value)}
        />
      );
    }
    return (
      <ComposInput
        key={key}
        className="resize-textarea"
        value={varInputData[id]}
        useAntd
        textarea
        rows={2}
        onChange={e => handleChange(id, e.target.value)}
      />
    );
  };

  return (
    <div ref={containerDOM} className={classNames(className, 'mf-prompt-variable-input kw-flex-column')}>
      <div className="kw-p-3 kw-c-text-lower">
        <div className="kw-mb-2 kw-c-text">{intl.get('prompt.varTip1')}</div>
        <div style={{ fontSize: 12 }}>{intl.get('prompt.varTip2')}</div>
      </div>

      <div className="kw-flex-item-full-height kw-pl-3 kw-pr-3 kw-pb-2" style={{ overflow: 'auto' }}>
        {_.map(variables, item => {
          return (
            <div key={item.id} className="kw-mb-3">
              <div className={classNames('kw-mb-1 kw-ellipsis', { 'kw-required': !item.optional })}>
                {item.field_name || item.var_name}
              </div>
              {renderComponent(item)}
            </div>
          );
        })}
      </div>

      {type === 'completion' && (
        <div className="btn-line kw-p-3">
          <Button type="primary" className="kw-mr-3" disabled={disabled} onClick={onRun}>
            {intl.get('global.run')}
          </Button>
          <Button className="kw-mr-3" onClick={onRestart}>
            {intl.get('global.clear')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default VariableInput;
