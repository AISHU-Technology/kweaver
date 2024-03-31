import React from 'react';
import ErrorModal from '../ErrorModal';
import { mount } from 'enzyme';

const defaultProps = { errorModal: true, handleCancel: jest.fn() };
const init = (props = defaultProps) => mount(<ErrorModal {...props} />);

describe('test UI is render', () => {
  it('test render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
