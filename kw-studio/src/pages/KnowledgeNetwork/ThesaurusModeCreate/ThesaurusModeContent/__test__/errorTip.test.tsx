import React from 'react';
import { Input } from 'antd';
import { mount } from 'enzyme';
import ErrorTip from '../ErrorTip';

const defaultProps = {
  errorText: 'xxxxx',
  children: <Input />
};

const init = (props = defaultProps) => mount(<ErrorTip {...props} />);

describe('test exists', () => {
  it('test', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
