import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import SearchResult, { SearchResultProps } from '../SearchResult';
import { mockResult } from './mockData';

const defaultProps = {
  resData: {},
  page: 1,
  onPageChange: jest.fn(),
  onReport: jest.fn(),
  onTitleClick: jest.fn(),
  onCanvasClick: jest.fn()
};
const init = (props: SearchResultProps = defaultProps) => mount(<SearchResult {...props} />);

describe('CognitiveSearch/SearchResult', () => {
  it('test view change', async () => {
    const wrapper = init();
    wrapper.setProps({ resData: mockResult });
    wrapper.update();

    // 默认列表展示, 且选中第一个
    expect(wrapper.find('.kg-search-list-res').exists()).toBe(true);
    expect(wrapper.find('.res-item').at(0).hasClass('checked')).toBe(true);

    // 切换json
    act(() => {
      wrapper.find('.view-btn').simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.kg-search-json-res').exists()).toBe(true);
  });

  it('test click callback function', () => {
    const wrapper = init();
    const onTitleClickSpy = jest.spyOn(wrapper.props(), 'onTitleClick');
    const onReportSpy = jest.spyOn(wrapper.props(), 'onReport');
    wrapper.setProps({ resData: mockResult });

    act(() => {
      wrapper.find('.res-item .file-name').at(0).simulate('click');
    });
    expect(onTitleClickSpy).toHaveBeenCalled();

    act(() => {
      wrapper.find('.res-item .detail-btn').at(0).simulate('click');
    });
    expect(onReportSpy).toHaveBeenCalled();
  });
});
