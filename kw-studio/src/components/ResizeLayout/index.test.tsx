import React from 'react';
import { mount } from 'enzyme';
import ResizeLayout from './index';

const defaultProps = {
  placement: 'right',
  isAll: true,
  children: {},
  onClose: jest.fn()
};
const init = (props = { isOpen: true }) => mount(<ResizeLayout {...defaultProps} />);

describe('ResizeLayout', () => {
  it('init wrapper', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
