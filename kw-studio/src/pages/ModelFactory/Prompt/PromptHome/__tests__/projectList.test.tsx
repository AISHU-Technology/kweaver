import React from 'react';
import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';
import ProjectList from '../ProjectList';

const defaultProps = {
  data: [],
  selectedCategory: {
    prompt_item_id: '172309482305435',
    prompt_item_name: '提示词更换里',
    prompt_item_type_id: '172399082305435',
    prompt_item_type_name: '分组1'
  },
  projectState: { loading: false, mountLoading: true, name: '', page: 1, searchTotal: 0, total: 0 },
  onSelect: jest.fn(),
  operateType: { current: '' },
  onOperate: jest.fn(),
  setSelectedCategory: jest.fn()
};
const init = (props = defaultProps) => mount(<ProjectList {...props} />);

describe('ProjectList', () => {
  it('test', async () => {
    const wrapper = init();
    await sleep();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('Button').length).toBe(1);
  });
});

describe('test Function', () => {
  it('search', async () => {
    const wrapper = init();
    act(() => {
      triggerPropsFunc(wrapper.find('SearchInput'), 'onChange', {
        persist: jest.fn(),
        target: { value: '任意关键字' }
      });
    });
  });
});
