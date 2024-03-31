import React from 'react';
import { mount } from 'enzyme';
import FileTree from '../FileTree';
import { mockDs } from './mockData';

const defaultProps = {
  source: mockDs[0],
  checkedKeys: [],
  selectedKey: undefined,
  errors: {},
  onChange: jest.fn(),
  onRowClick: jest.fn()
};
const init = (props = defaultProps) => mount(<FileTree {...props} />);

describe('AddSourceModal/FileTree', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
