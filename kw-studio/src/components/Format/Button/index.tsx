import React from 'react';
import classnames from 'classnames';
import { Button as AntdButton, Tooltip } from 'antd';
import { ButtonType } from '../type';
import './style.less';

const SIZE = {
  large: 'kw-format-button-large',
  middle: 'kw-format-button-middle',
  small: 'kw-format-button-small',
  smallest: 'kw-format-button-smallest'
};

const SIZE_ICON = {
  middle: 'kw-format-icon-middle',
  small: 'kw-format-icon-small'
};

const Button = (props: ButtonType) => {
  const { size = 'middle', children, className, type, tip = '', tipPosition = 'bottom', ...othersProps } = props;
  const extendSize = SIZE[size as keyof typeof SIZE] || '';
  const extendSize_Icon = SIZE_ICON[size as keyof typeof SIZE_ICON] || '';

  const renderButton = () => {
    if (type === 'text') {
      return (
        <Tooltip title={tip} placement={tipPosition} trigger={['hover']}>
          <AntdButton {...othersProps} className={classnames('kw-btn-text', className)} type="text">
            {children}
          </AntdButton>
        </Tooltip>
      );
    }

    if (type === 'text-b') {
      return (
        <Tooltip title={tip} placement={tipPosition} trigger={['hover']}>
          <AntdButton {...othersProps} className={classnames('kw-btn-text-b', className)} type="text">
            {children}
          </AntdButton>
        </Tooltip>
      );
    }

    if (type === 'link') {
      return (
        <Tooltip title={tip} placement={tipPosition} trigger={['hover']}>
          <AntdButton {...othersProps} className={classnames('kw-btn-link', className)} type="link">
            {children}
          </AntdButton>
        </Tooltip>
      );
    }

    if (type === 'icon') {
      return (
        <Tooltip title={tip} placement={tipPosition} trigger={['hover']}>
          <span
            {...othersProps}
            className={classnames(className, extendSize_Icon, 'kw-btn-icon', {
              'kw-btn-icon-disabled': othersProps.disabled
            })}
            onClick={e => {
              if (!othersProps.disabled) {
                othersProps.onClick && othersProps.onClick(e);
              }
            }}
          >
            {children}
          </span>
        </Tooltip>
      );
    }

    if (type === 'icon-text') {
      const childrenList = React.Children.toArray(children);
      const flag_1 = childrenList.length === 2 && typeof childrenList[1] === 'string';
      const flag_2 = childrenList.length === 2 && typeof childrenList[1] === 'object';
      const flag_3 =
        childrenList.length === 3 && typeof childrenList[0] === 'object' && typeof childrenList[2] === 'object';

      return (
        <Tooltip title={tip} placement={tipPosition} trigger={['hover']}>
          <span
            {...othersProps}
            className={classnames(
              { 'kw-btn-icon-text': flag_1 },
              { 'kw-btn-text-icon': flag_2 },
              { 'kw-btn-icon-text-icon': flag_3 },
              className,
              {
                'kw-btn-icon-text-disabled': othersProps.disabled
              }
            )}
            onClick={e => {
              if (!othersProps.disabled) {
                othersProps.onClick?.(e);
              }
            }}
          >
            {children}
          </span>
        </Tooltip>
      );
    }

    if (type === 'icon-text-link') {
      const childrenList = React.Children.toArray(children);
      const flag_1 = childrenList.length === 2 && typeof childrenList[1] === 'string';
      const flag_2 = childrenList.length === 2 && typeof childrenList[1] === 'object';
      const flag_3 =
        childrenList.length === 3 && typeof childrenList[0] === 'object' && typeof childrenList[2] === 'object';

      return (
        <Tooltip title={tip} placement={tipPosition} trigger={['hover']}>
          <span
            {...othersProps}
            className={classnames(
              { 'kw-btn-icon-text-link': flag_1 },
              { 'kw-btn-text-icon-link': flag_2 },
              { 'kw-btn-icon-text-icon-link': flag_3 },
              className,
              {
                'kw-btn-icon-disabled': othersProps.disabled
              }
            )}
            onClick={e => {
              if (!othersProps.disabled) {
                othersProps.onClick?.(e);
              }
            }}
          >
            {children}
          </span>
        </Tooltip>
      );
    }

    if (type === 'u-icon') {
      return (
        <Tooltip title={tip} placement={tipPosition} trigger={['hover']}>
          <AntdButton
            className={classnames(className, 'kw-btn-u-icon', {
              'kw-btn-u-icon-disabled': othersProps.disabled
            })}
            {...othersProps}
            type={type as any}
          >
            {children}
          </AntdButton>
        </Tooltip>
      );
    }
    if (type === 'u-icon-primary') {
      return (
        <Tooltip title={tip} placement={tipPosition} trigger={['hover']}>
          <AntdButton
            className={classnames(className, 'kw-btn-u-icon', {
              'kw-btn-u-icon-disabled': othersProps.disabled
            })}
            {...othersProps}
            type={type.slice(-7) as any}
          >
            {children}
          </AntdButton>
        </Tooltip>
      );
    }

    return (
      <Tooltip title={tip} placement={tipPosition} trigger={['hover']}>
        <AntdButton
          className={classnames(extendSize, className, 'kw-format-button')}
          {...othersProps}
          type={type as any}
        >
          {children}
        </AntdButton>
      </Tooltip>
    );
  };
  return renderButton();
};

export default Button;
