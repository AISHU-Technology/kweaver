import React from 'react';
import type { ButtonProps, InputProps, SelectProps } from 'antd';

type TooltipPlacement =
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom';
export type TextInterface = {
  tip?: React.ReactNode;
  intl?: string;
  level?: number;
  align?: string;
  strong?: number;
  noHeight?: boolean;
  tipPosition?: TooltipPlacement;
  children?: React.ReactNode;
  ellipsis?: boolean;
  title?: string;
  style?: React.CSSProperties;
  className?: string;
};

type SizeTypes = 'small' | 'middle' | 'large' | 'smallest' | undefined;
export type ButtonType = Omit<ButtonProps, 'size'> & {
  size?: SizeTypes;
  className?: string;
  children?: string | object;
};

export type ContainerType = Omit<SelectProps, ''> & {
  span?: string | number;
  className?: string;
  children?: string | object;
};

export type InputType = Omit<InputProps, ''> & {
  size?: string;
  className?: string;
  children?: string | object;
};

export type SelectType = Omit<SelectProps, ''> & {
  size?: string;
  className?: string;
  children?: string | object;
};
