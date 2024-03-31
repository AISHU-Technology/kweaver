import React from 'react';
import classnames from 'classnames';

import { ButtonType, ContainerType, InputType, SelectType, TextInterface } from './type';

import Button from './Button';
import Container from './Container';
import Input from './Input';
import InputNumber from './InputNumber';
import Select from './Select';
import Text from './Text';
import HeaderText from './HeaderText';

export type FormatComponent = {
  Button: React.FC<ButtonType>;
  Container: React.FC<ContainerType>;
  Input: React.FC<InputType>;
  InputNumber: React.FC<InputType>;
  Select: React.FC<SelectType>;
  Text: React.FC<TextInterface>;
  Title: React.FC<TextInterface>;
  HeaderText: React.FC<TextInterface>;
  HeaderTitle: React.FC<TextInterface>;
};

const Format: FormatComponent = () => null;

Format.Button = Button;
Format.Container = Container;
Format.Input = Input;
Format.InputNumber = InputNumber;
Format.Select = Select;
Format.Text = Text;
Format.HeaderText = HeaderText;
Format.Title = (props: TextInterface) => (
  <Text strong={6} {...props} className={classnames('kw-c-text', props.className)} />
);
Format.HeaderTitle = (props: TextInterface) => (
  <HeaderText level={16} strong={6} {...props} className={classnames('kw-c-header', props.className)} />
);

export default Format;
