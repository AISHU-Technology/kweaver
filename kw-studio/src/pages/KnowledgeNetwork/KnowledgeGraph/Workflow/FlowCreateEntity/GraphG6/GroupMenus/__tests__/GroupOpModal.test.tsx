import React from 'react';
import { mount } from 'enzyme';
import GroupOpModal from '../GroupOpModal';

const defaultProps = {
  visible: true,
  type: 'create',
  group: {} as any,
  onOk: jest.fn(),
  onCancel: jest.fn()
};
const init = (props = defaultProps) => mount(<GroupOpModal {...props} />);

describe('GroupMenus/GroupOpModal', () => {
  it('test render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
