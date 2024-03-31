import React from 'react';
import classNames from 'classnames';
import _ from 'lodash';

import PromptIcon from '../PromptIcon';

export type IconRadioProps = {
  className?: string;
  type?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
};

const IconRadio = (props: IconRadioProps) => {
  const { className, type, value, onChange } = props;
  return (
    <div className={classNames('kw-align-center', className)}>
      {Array.from({ length: 10 }, (v, i) => i).map(i => (
        <PromptIcon
          key={i}
          className={classNames('icon-radio-item kw-mr-5 kw-pointer', {
            'kw-ml-2': !i,
            checked: String(value) === String(i)
          })}
          type={type}
          icon={i}
          onClick={() => onChange?.(String(i))}
        />
      ))}
    </div>
  );
};

export default IconRadio;
