import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import Code from '../Code';
import { parameters } from './mockData';

const defaultProps = {
  parameters, // 参数
  isDisabled: true, // 是否可编辑
  codeError: true, // 代码长度过长
  onErrorChange: jest.fn(),
  onParamChange: jest.fn() // 改变参数
};

const init = (props = defaultProps) => mount(<Code {...props} />);

describe('function init', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
