import React from 'react';

import { mount } from 'enzyme';
import { triggerPropsFunc, act, sleep } from '@/tests';

import MoveModal from '../MoveModal';

const defaultProps = {
  data: {
    create_by: 'ccc',
    create_time: '2024-81-17 14:39:40',
    icon: '5',
    model_id: '',
    model_name: '',
    model_series: '',
    prompt_deploy: false,
    prompt_desc: '',
    prompt_id: '1750039637110267994',
    prompt_item_id: '1747505243341590529',
    prompt_item_name: '提示词管理',
    prompt_item_type: '分组',
    prompt_item_type_id: '1747506707879912512',
    prompt_name: '5',
    prompt_service_id: '1750030637152219944',
    prompt_type: 'completion',
    prompt_item_type_name: 'c',
    update_by: 'userForTestAuth675 dispaly',
    update_time: 'userForTestAuth675 dispaly'
  },
  onCancel: jest.fn(),
  onOk: jest.fn(),
  visible: true,
  projectList: [
    {
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
  ]
};

const init = (props = defaultProps) => mount(<MoveModal {...props} />);

describe('MoveModal', () => {
  it('exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('Button').length).toBe(2);
  });
});

describe('Function', () => {
  it('search', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('SearchInput'), 'onChange', { persist: jest.fn(), target: { value: '任意关键字' } });
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
