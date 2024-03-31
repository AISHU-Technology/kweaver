import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import PropertyList from './index';

const mockProList = Array.from({ length: 3 }, (_, i) => ({
  name: '名称' + i,
  alias: '显示名' + i,
  type: 'string',
  checked: true
}));

const defaultProps = {
  type: 'node' as const,
  property: mockProList,
  errorData: {},
  page: 1,
  PAGESIZE: 10,
  disabled: false,
  forceDisabled: false,
  aliasChangeWithName: false,
  setAliasChangeWithName: jest.fn(),
  onChange: jest.fn(),
  onTypeChange: jest.fn(),
  onIndexesChange: jest.fn(),
  onError: jest.fn(),
  onDelete: jest.fn(),
  onBlur: jest.fn(),
  updateData: jest.fn()
};
const init = (props = defaultProps) => mount(<PropertyList {...props} />);

describe('PropertyList', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
