import React from 'react';
import { mount } from 'enzyme';
import OperateBar from '../components/OperateBar';

const defaultProps = {
  items: [{ key: 'edit', label: '编辑' }],
  onItemClick: jest.fn()
};
const init = (props = defaultProps) => mount(<OperateBar {...props} />);

describe('LLMModel/components/OperateBar', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
