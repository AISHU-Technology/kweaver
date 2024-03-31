import React from 'react';
import { mount } from 'enzyme';
import CreateDrawer from '../CreateDrawer';

const defaultProps = {
  isOpen: true,
  isDisabled: false,
  editInfo: {},
  onChangeDrawer: jest.fn(),
  onChangeState: jest.fn()
};

const init = (props = defaultProps) => mount(<CreateDrawer {...props} />);

describe('create init', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
