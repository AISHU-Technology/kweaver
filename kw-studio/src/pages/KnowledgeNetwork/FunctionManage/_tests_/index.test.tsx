import React from 'react';
import { mount } from 'enzyme';
import FunctionManage from '../index';

const defaultProps = { kgData: {} };
const init = (props = defaultProps) => mount(<FunctionManage {...props} />);

describe('function init', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
