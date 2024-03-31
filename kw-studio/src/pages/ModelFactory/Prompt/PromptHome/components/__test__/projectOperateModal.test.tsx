import React from 'react';

import { mount } from 'enzyme';
import { triggerPropsFunc, act, sleep } from '@/tests';

import ProjectOperateModal from '../ProjectOperateModal';

const defaultProps = {
  onCancel: jest.fn(),
  onOk: jest.fn(),
  visible: true,
  action: 'create',
  data: {
    create_by: 'ccc',
    create_time: '2024-81-17 14:39:40',
    prompt_item_id: '1747505243341590529',
    prompt_item_name: '提示词管理',
    prompt_item_types: [
      {
        id: '1747506707879912512',
        name: '分组'
      }
    ],
    update_by: 'userForTestAuth675 dispaly',
    update_time: 'userForTestAuth675 dispaly'
  }
};

const init = (props = defaultProps) => mount(<ProjectOperateModal {...props} />);

describe('ProjectOperateModal', () => {
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
