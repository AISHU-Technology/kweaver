import React from 'react';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import intl from 'react-intl-universal';

export interface VarTypeRadioProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const TYPES = [
  {
    key: 'number',
    label: intl.get('prompt.number'),
    icon: <IconFont type="icon-shuzhi" style={{ fontSize: 20 }} />
  },
  {
    key: 'text',
    label: intl.get('prompt.text'),
    icon: <IconFont type="icon-bianliangwenben" />
  },
  {
    key: 'textarea',
    label: intl.get('prompt.textarea'),
    icon: <IconFont type="icon-duanla" />
  },
  {
    key: 'selector',
    label: intl.get('prompt.selector'),
    icon: <IconFont type="icon-liebiao" />
  }
];

const VarTypeRadio = (props: any) => {
  const { className, value, onChange } = props;

  const onSelect = (key: string) => {
    onChange?.(key);
  };

  return (
    <div className={classNames(className, 'kw-flex')}>
      {TYPES.map(({ key, icon, label }, index) => {
        return (
          <div
            key={key}
            className={classNames('variable-radio-item kw-column-center kw-pointer', {
              checked: value === key,
              'kw-ml-3': index
            })}
            onClick={() => onSelect(key)}
          >
            <div style={{ fontSize: 18 }}>{icon}</div>
            <div className="kw-c-text">{label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default VarTypeRadio;
