import { Dropdown, Input } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { InputProps } from 'antd';
import _ from 'lodash';

import './style.less';
import intl from 'react-intl-universal';
import { ONLY_KEYBOARD } from '@/enums';

interface DropdownInputType extends InputProps {
  existData?: string[]; // 已存在的数据
  errorInfo?: string;
  initValue?: string;
  onBlur?: any;
  onPressEnter?: any;
}

export type DropdownInputRefProps = {
  inputRef: any;
  getError: () => string;
  getValue: () => string;
  setValue: (value: string) => void;
  setError: (error: string) => void;
};

const DropdownInputFun: React.ForwardRefRenderFunction<DropdownInputRefProps, DropdownInputType> = (props, ref) => {
  const { errorInfo, initValue, existData = [], onBlur, onPressEnter, size = 'middle', onChange, onFocus } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>(''); // 值
  const [errorText, setErrorText] = useState<string>('');

  const inputRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    inputRef: inputRef.current,
    getError,
    setError,
    getValue,
    setValue
  }));

  useEffect(() => {
    if (initValue) {
      setValue(initValue);
    }
  }, [initValue]);

  useEffect(() => {
    if (errorInfo) {
      setErrorText(errorInfo);
      // setOpen(true);
    }
  }, [errorInfo]);

  const getError = () => {
    return errorText;
  };
  const getValue = () => {
    return value;
  };

  const setError = (error: string) => {
    if (error) {
      setErrorText(error);
      // setOpen(true);
    } else {
      setErrorText('');
      // setOpen(false);
    }
  };

  /** 监听输入报错 */
  const handleChange = (e?: any) => {
    const text = e?.target?.value.trim();
    let errors = '';

    if (!text) errors = intl.get('glossary.notNull');
    if (!ONLY_KEYBOARD.test(text) && text) errors = intl.get('global.onlyKeyboard');
    if (text?.length > 255) errors = intl.get('global.lenErr', { len: 255 });
    if (existData?.includes(text)) errors = intl.get('glossary.glossaryDuplicateName');

    setErrorText(errors);
    // setOpen(!!errors);
    // return errors;
  };

  const overlay = () => {
    if (errorText) {
      return (
        <div
          className="errorWrapper"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          {errorText}
        </div>
      );
    }
    return <span />;
  };

  return (
    <Dropdown overlayClassName="dropDownInputRoot" overlay={overlay} trigger={['hover']}>
      <Input
        size={size}
        ref={inputRef}
        value={value}
        autoFocus
        onChange={e => {
          setValue(e?.target?.value);
          handleChange(e);
          onChange?.(e);
        }}
        onBlur={e => {
          // if (!errorText) {
          //   const error = handleChange(e);
          //   onBlur?.(value, error);
          // }
          onBlur?.(value, errorText);
        }}
        onPressEnter={(e: any) => {
          // if (!errorText) {
          //   const error = handleChange(e);
          //   onPressEnter?.(value, error);
          // }
          onPressEnter?.(value, errorText);
        }}
        style={{ borderColor: errorText ? '#f5222d' : '' }}
        onClick={e => e.stopPropagation()}
        onFocus={e => {
          onFocus?.(e);
        }}
      />
    </Dropdown>
  );
};
const DropdownInput = forwardRef(DropdownInputFun);
export default DropdownInput;
