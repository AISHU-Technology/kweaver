import React from 'react';

import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';

import PromptTextarea from '../PromptTextarea';

const defaultProps = {
  className: 'kw-mb-6',
  disable: false,
  formData: { icon: '5', prompt_item_id: '1747505243341598529', prompt_type: 'completion' },
  isError: true,
  onBlur: jest.fn(),
  onFocus: jest.fn(),
  onUseTemplate: jest.fn(),
  onValueChange: jest.fn(),
  onVariableChange: jest.fn(),
  promptType: 'completion',
  setIsChange: jest.fn(),
  variables: []
};

const init = (props = defaultProps) => mount(<PromptTextarea {...props} />);

describe('PromptTextarea', () => {
  it('exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    wrapper.setProps({ isError: false });
  });
});

describe('Function', () => {
  it('click', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.kw-c-text-lower').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();

    act(() => {
      const wrapper = init();
      wrapper.find('.kw-c-text-lower').at(1).simulate('click');
    });

    await sleep();
    wrapper.update();

    triggerPropsFunc(wrapper.find('PromptTempModal'), 'onCancel');
  });
});
