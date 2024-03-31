import React from 'react';

import { mount } from 'enzyme';
import { triggerPropsFunc, act, sleep } from '@/tests';

import DeleteModal from '../DeleteModal';

const defaultProps = {
  onCancel: jest.fn(),
  onOk: jest.fn(),
  visible: true,
  type: 'project'
};

const init = (props = defaultProps) => mount(<DeleteModal {...props} />);

describe('DeleteModal', () => {
  it('exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('Button').length).toBe(2);
  });
});

describe('Function', () => {
  it('search', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('Input'), 'onChange', { persist: jest.fn(), target: { value: '任意关键字' } });
  });

  it('test click', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('Button').at(1).simulate('click');
    });
  });
});
