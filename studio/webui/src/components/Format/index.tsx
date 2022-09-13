import React from 'react';
import classnames from 'classnames';

import { TextInterface } from './type';

import Button from './Button';
import Container from './Container';
import Input from './Input';
import Select from './Select';
import Text from './Text';

const Format = () => null;

Format.Button = Button;
Format.Container = Container;
Format.Input = Input;
Format.Select = Select;
Format.Text = Text;
Format.Title = (props: TextInterface) => (
  <Text strong={6} {...props} className={classnames('ad-c-header', props.className)} />
);

export default Format;
