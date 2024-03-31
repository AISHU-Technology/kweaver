import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import GroupSelector from './index';

const defaultProps = {
  groupList: [],
  value: [],
  node: {},
  onChange: jest.fn(),
  onCreateGroup: jest.fn()
};
const init = (props = defaultProps) => mount(<GroupSelector {...props} />);

describe('GroupSelector', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
