import React, { useState, useEffect, useRef } from 'react';
import { Popover } from 'antd';
import './style.less';

const ErrorTip = (props: any) => {
  const { errorText, children } = props;
  const isFocus = useRef(false);
  const [visible, setVisible] = useState(false);
  const childrenElement = React.Children.only(children);
  useEffect(() => {
    if (!isFocus.current) return;
    setVisible(!!errorText);
  }, [errorText]);

  /**
   * 劫持focus
   */
  const handleFocus = (e: any) => {
    isFocus.current = true;
    errorText && setVisible(true);
    childrenElement?.props?.onFocus?.(e);
  };

  /**
   * 劫持blur
   */
  const handleBlur = (e: any) => {
    isFocus.current = false;
    // setVisible(false);
    childrenElement?.props?.onBlur?.(e);
  };

  /**
   * 开关控制
   */
  const onVisibleChange = (isOpen: boolean) => {
    // if (isFocus.current && !isOpen) return;
    setVisible(isOpen);
  };

  const element = React.cloneElement(childrenElement, {
    ...(childrenElement.props || {}),
    onFocus: handleFocus,
    onBlur: handleBlur
  });

  return (
    <Popover
      overlayClassName="onto-pro-error-tip"
      trigger={['hover']}
      content={errorText}
      placement="bottomLeft"
      destroyTooltipOnHide
      open={visible}
      onOpenChange={onVisibleChange}
    >
      {element}
    </Popover>
  );
};

export default ErrorTip;
