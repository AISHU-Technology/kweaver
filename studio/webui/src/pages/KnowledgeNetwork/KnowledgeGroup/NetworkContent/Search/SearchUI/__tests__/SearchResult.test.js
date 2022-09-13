import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import { mockRes, mockTime } from './mockData';
import SearchResult from '../SearchResult';

const defaultProps = {
  resData: mockRes,
  resInfo: mockTime,
  onCheckChange: jest.fn(),
  onPageChange: jest.fn(),
  onDetail: jest.fn(),
  onReport: jest.fn(),
  onTitleClick: jest.fn()
};
const init = (props = {}) => mount(<SearchResult {...props} />);

describe('SearchUI/SearchResult', () => {
  // 正常渲染
  it('test render', () => {
    const wrapper = init(defaultProps);

    expect(wrapper.find('.row').length).toBe(mockRes.length);
    wrapper.unmount();
  });

  // 复选框
  it('test ', async () => {
    const wrapper = init(defaultProps);
    const spyCheck = jest.spyOn(wrapper.props(), 'onCheckChange');
    const selectedValues = [mockRes[0]];

    // 选择
    act(() => {
      wrapper
        .find('.ant-checkbox-input')
        .at(0)
        .simulate('change', { target: { checked: true } });
    });
    expect(spyCheck.mock.calls[0][0]).toEqual(selectedValues);

    // 取消选择
    wrapper.setProps({ selectedValues });
    act(() => {
      wrapper
        .find('.ant-checkbox-input')
        .at(0)
        .simulate('change', { target: { checked: false } });
    });
    expect(spyCheck.mock.calls[1][0]).toEqual([]);
    spyCheck.mockRestore();
  });

  // 点击标题
  it('test onTitleClick', async () => {
    const wrapper = init(defaultProps);
    const spyTitle = jest.spyOn(wrapper.props(), 'onTitleClick');

    act(() => {
      wrapper.find('.info-row .title').at(0).simulate('click');
    });
    expect(spyTitle).toHaveBeenCalled();
    spyTitle.mockRestore();
  });

  // 点击分析报告
  it('test onReport', async () => {
    const wrapper = init(defaultProps);
    const spyReport = jest.spyOn(wrapper.props(), 'onReport');

    act(() => {
      wrapper.find('.operation-box .detail-btn').at(0).simulate('click');
    });
    expect(spyReport).toHaveBeenCalled();
    spyReport.mockRestore();
  });

  // 点击详情
  it('test onDetail', async () => {
    const wrapper = init(defaultProps);
    const spyDetail = jest.spyOn(wrapper.props(), 'onDetail');

    act(() => {
      wrapper.find('.operation-box .detail-btn').at(1).simulate('click');
    });
    expect(spyDetail).toHaveBeenCalled();
    spyDetail.mockRestore();
  });
});
