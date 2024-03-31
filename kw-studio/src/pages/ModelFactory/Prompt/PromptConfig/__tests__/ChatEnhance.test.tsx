import React from 'react';
import { mount } from 'enzyme';
import ChatEnhance from '../components/ChatEnhance';

const defaultProps = {
  value: '111',
  disabled: false,
  onSave: jest.fn()
};
const init = (props = defaultProps) => mount(<ChatEnhance {...props} />);

describe('PromptConfig/components/ChatEnhance', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
