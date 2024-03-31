import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import SearchResult from '../SearchResult';
import { queryData } from './mock';

const defaultProps: any = {
  resData: {
    count: 10
  },
  page: 1,
  kgqaResData: {},
  allResData: {},
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
  selfState: { loading: false, cat: '全部资源', resultEmpty: false },
  onCardClick: () => {},
  ref: {}
};

const init = (props = defaultProps) => mount(<SearchResult {...props} />);

describe('CognitiveSearch/SearchResult', () => {
  it('test empty all', async () => {
    const wrapper = init();
    wrapper.setProps({ resData: { full_text: null, query_understand: null } });
    expect(wrapper.find('.test-complete-search-content-root').at(0).exists()).toBe(true);
    expect(wrapper.find('.no-complete-search-small').at(0).exists()).toBe(true);
  });
  it('test result', async () => {
    const wrapper = init();
    wrapper.setProps({ resData: queryData });
    // expect(wrapper.find('.res-count').at(0).find('span').at(0).text()).toBe('找到');
    // expect(wrapper.find('.res-count').at(0).find('span').at(2).text()).toBe(
    //   `条   (用时 ${queryData.full_text.execute_time} 秒)`
    // );
    // expect(wrapper.find('.label-text').at(0).text()).toBe('切换 json 格式');
  });
});

describe('Function test', () => {
  it('test click', async () => {
    const wrapper = init();
    wrapper.setProps({ resData: queryData });
    // act(() => {
    //   wrapper.find('.label-text').at(0).simulate('click');
    // });
  });
});
