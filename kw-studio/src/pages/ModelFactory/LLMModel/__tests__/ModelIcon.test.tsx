import React from 'react';
import { mount } from 'enzyme';
import ModelIcon from '../components/ModelIcon';

const defaultProps = {};
const init = (props = defaultProps) => mount(<ModelIcon {...props} />);

describe('LLMModel/components/ModelIcon', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
