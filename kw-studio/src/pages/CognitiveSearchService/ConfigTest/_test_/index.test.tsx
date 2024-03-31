import React from 'react';
import ConfigTest from '..';
import { mount } from 'enzyme';
import { act } from '@/tests';

const defaultProps = {
  resData: {},
  page: 1,
  onCatChange: jest.fn(),
  setFullResponse: jest.fn(),
  onPageChange: jest.fn(),
  testData: {
    props: {
      full_text: { search_config: [], switch: false, oldSwitch: false },
      query_understand: {
        switch: false,
        oldSwitch: false,
        intention_recognition: {
          intent_pool_id: 0,
          intent_pool_name: '',
          intentListTable: []
        }
      },
      data_source_scope: []
    }
  },
  selfState: { loading: false, cat: '全部资源', resultEmpty: false }
};

const init = (props = defaultProps) => mount(<ConfigTest {...props} />);

describe('test UI', () => {
  it('UI', () => {
    const wrapper = init();
    expect(wrapper.find('.kw-pl-6').at(0).text()).toBe('退出');
    expect(wrapper.find('Input').exists()).toBe(true);
    expect(wrapper.find('Button').at(1).text()).toBe('搜索');
  });
  it('inception status', () => {
    const wrapper = init();
    const wrapperStatus = wrapper.setProps({ resData: { full_text: {} } });
    expect(wrapperStatus.find('.no-complete-search').at(0).text()).toBe('请输入关键词快速查找');
  });
});

describe('Function test', () => {
  it('test click', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.kw-pl-6').at(0).simulate('click');
    });

    act(() => {
      wrapper.find('Input').simulate('change', { target: { value: '搜索' } });
    });

    act(() => {
      wrapper.find('Button').at(1).simulate('click');
    });
  });
});
