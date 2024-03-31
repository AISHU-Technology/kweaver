import React from 'react';
import ErrorModal from '../ErrorModal';
import { mount } from 'enzyme';
import { act } from '@/tests';

const defaultProps = {
  errorModal: true,
  handleCancel: jest.fn()
};
const init = (props = defaultProps) => mount(<ErrorModal {...props} />);

describe('test UI is render', () => {
  const wrapper = init();
  expect(wrapper.exists()).toBe(true);

  expect(wrapper.find('Button').at(0).text()).toBe('关 闭');
  expect(wrapper.find('.error-modal-title').at(0).text()).toBe('错误详情');
});

describe('test Function', () => {
  const wrapper = init();
  it('test button click', async () => {
    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
  });
});
