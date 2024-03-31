import React, { useState } from 'react';
import classNames from 'classnames';
import ComposInput from '@/components/ComposInput';
import './style.less';

export interface TitleInputProps {
  className?: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}

const TitleInput = (props: TitleInputProps) => {
  const { className, label, value, placeholder, onChange } = props;
  const [focused, setFocused] = useState(false);

  return (
    <div className={classNames(className, 'knw-card-title-input kw-align-center', { focused })}>
      <div className="title-label">{label}</div>
      <ComposInput
        className="kw-flex-item-full-width"
        useAntd
        bordered={false}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
};

export default TitleInput;
