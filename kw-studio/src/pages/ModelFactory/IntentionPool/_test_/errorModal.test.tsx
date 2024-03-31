import React from 'react';
import ErrorModal from '../ErrorModal';
import { mount } from 'enzyme';
import { act } from '@/tests';

const defaultProps = {
  handleCancel: jest.fn(),
  errorDes: {},
  isErrorModal: true
};

const init = (props = defaultProps) => mount(<ErrorModal {...props} />);

describe('UI test', () => {
  it('modal UI', () => {
    const wrapper = init();
    expect(wrapper.find('.error-modal-title').at(0).text()).toBe('失败详情');
    expect(wrapper.find('.error-modal-button').at(0).text()).toBe('关 闭');
  });
});

describe('Function test', () => {
  it('close click', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.error-modal-button').at(0).simulate('click');
    });
  });
});
