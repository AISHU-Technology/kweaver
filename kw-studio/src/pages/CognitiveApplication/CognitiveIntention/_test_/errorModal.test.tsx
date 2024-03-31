import React from 'react';
import ErrorModal from '../ErrorModal';
import { mount } from 'enzyme';
import { act } from '@/tests';

const defaultProps = {
  handleCancel: jest.fn(),
  errorModal: true
};

const init = (props = defaultProps) => mount(<ErrorModal {...props} />);

describe('UI test', () => {
  it('modal UI', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
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
