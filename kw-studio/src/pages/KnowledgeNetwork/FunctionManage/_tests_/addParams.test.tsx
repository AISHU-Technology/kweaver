import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import AddParams from '../Code/addParamsModal';
import { parameters } from './mockData';

const defaultProps = {
  visible: true,
  parameters,
  selectValue: 'aaa',
  editParam: {
    name: 'id',
    alias: 'asd',
    example: 1,
    description: '描述1',
    position: [1, 5, 10]
  },
  onHandleOk: jest.fn(),
  onCancel: jest.fn()
};

const init = (props = defaultProps) => mount(<AddParams {...props} />);

describe('function init', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('test click', () => {
  it('ok bottom', async () => {
    const wrapper = init();
    act(() => {
      wrapper
        .find('.ant-input')
        .at(0)
        .simulate('change', { target: { value: 'aba' } });

      wrapper.find('.ant-btn').at(1).simulate('click');
    });
    await sleep();
  });
  it('cancel bottom', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.ant-btn').at(0).simulate('click');
    });
    await sleep();
  });
});
