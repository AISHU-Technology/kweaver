import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import ProjectHeader from '../ProjectHeader';

const defaultProps = {
  selectedCategory: {
    prompt_item_id: '172309482305435',
    prompt_item_name: '提示词更换里',
    prompt_item_type_id: '172399082305435',
    prompt_item_type_name: '分组1'
  },
  onOperate: jest.fn()
};
const init = (props = defaultProps) => mount(<ProjectHeader {...props} />);

describe('ProjectHeader', () => {
  it('UI', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('Button').length).toBe(2);
  });
});

describe('Function', () => {
  it('btn click', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper.find('Button').at(1).simulate('click');
    });
    await sleep();
    wrapper.update();
  });
});
