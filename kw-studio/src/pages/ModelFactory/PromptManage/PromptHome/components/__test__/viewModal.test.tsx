import React from 'react';

import { act } from '@/tests';

import ViewModal from '../ViewModal';

import { mount } from 'enzyme';

const defaultProps = {
  setViewModal: jest.fn(),
  visible: true,
  recordData: {
    create_by: 'test',
    create_time: '2024-11-12 13:14:12',
    icon: '5',
    model_id: '',
    model_name: '',
    model_series: '',
    prompt_deploy: false,
    prompt_desc: '',
    prompt_id: '1750750216530825216',
    prompt_item_id: '1747505243341590529',
    prompt_item_name: '管理',
    prompt_item_type: '分组',
    prompt_item_type_id: '1747506707870912512',
    prompt_name: '111',
    prompt_service_id: '1750750216572768256',
    prompt_type: 'completion',
    update_by: 'test',
    update_time: '2024-01-20 12:13:14'
  }
};

const init = (props = defaultProps) => mount(<ViewModal {...props} />);

describe('ViewModal', () => {
  it('exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    wrapper.update();
  });
});

describe('Click', () => {
  it('cancel', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
  });
});
