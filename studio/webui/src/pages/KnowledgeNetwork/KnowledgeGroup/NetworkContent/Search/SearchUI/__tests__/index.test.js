import React from 'react';
import { shallow } from 'enzyme';
import { sleep } from '@/tests';
import servicesExplore from '@/services/explore';
import { mockTime, mockRes, mockE, mockClass, mockGraph, mockTags } from './mockData';
import SearchUI from '../index';

jest.mock('@/utils/graphQL-search', () => ({
  exploreQuery: jest.fn((_, params) =>
    Promise.resolve(
      params.size
        ? { data: { search_v: { ...mockTime, vertexes: mockRes } } } // 搜索接口mock
        : { data: { search_e: { ...mockE } } } // 进出边接口mock
    )
  ),
  // 获取所有点类接口mock
  kgQuery: jest.fn(() => Promise.resolve({ data: { kg: { onto: { v: mockClass } } } }))
}));
// 分析报告接口mock
servicesExplore.analysisReportGet = jest.fn(() =>
  Promise.resolve({ res: { name: '分析报告', content: [], entity: [] } })
);

const defaultProps = {
  history: { push: jest.fn() },
  visible: true,
  nodes: [],
  selectGraph: mockGraph[0],
  selectedGraph: mockGraph[0],
  selectClass: mockClass[0],
  setVisible: jest.fn(),
  setGraph: jest.fn(),
  setClass: jest.fn(),
  onGraphChange: jest.fn(),
  onToExplore: jest.fn()
};
const init = (props = {}) => shallow(<SearchUI {...props} />);

describe('SearchUI', () => {
  // 初始化获取点类
  it('should render', async () => {
    const wrapper = init(defaultProps);
    await sleep();
    expect(wrapper.state().classData).toEqual(mockClass);
  });

  // 搜索
  it('test search', async () => {
    const wrapper = init(defaultProps);

    await sleep();
    wrapper.instance().searchInputRef = { current: { state: { value: '' } } };
    wrapper.find('.input-group Button').at(0).simulate('click');
    await sleep();
    expect(wrapper.state().resInfo).toEqual(mockTime);
    expect(wrapper.state().resData).toEqual(mockRes);
  });

  // 清除数据
  it('test clearData', async () => {
    const wrapper = init();

    wrapper.setState({ keyword: '1' });
    wrapper.instance().clearData();
    expect(wrapper.state().keyword).toBe('');
  });

  // 筛选条件
  it('test onAddConditions', async () => {
    const wrapper = init();

    // 添加
    wrapper.instance().onAddConditions(mockTags);
    expect(wrapper.state().conditions).toEqual(mockTags);

    // 展开
    wrapper.setState({ fold: { isOpen: false } });
    wrapper.find('.tags-box .open-btn').simulate('click');
    expect(wrapper.state().fold).toEqual({ isOpen: true });

    // 清空
    wrapper.find('.clear-tag').simulate('click');
    expect(wrapper.state().conditions).toEqual([]);
  });

  // 复选框
  it('test onCheckChange', async () => {
    const wrapper = init();

    wrapper.setState({ resData: mockRes });
    wrapper.instance().onCheckChange([mockRes[0]]);
    expect(wrapper.state().selectedValues).toEqual([mockRes[0]]);
    expect(wrapper.state().checkStatus).toEqual({ isAll: false, isPart: true });

    // 模拟添加探索后重新打开界面
    wrapper.setProps({ visible: false, nodes: [mockRes[1]] });
    wrapper.setProps({ visible: true });
    expect(wrapper.state().checkStatus).toEqual({ isAll: true, isDisabled: false, isPart: false });

    // 含有禁用, 全反选、全选
    wrapper.instance().onCheckAll();
    expect(wrapper.state().checkStatus).toEqual({ isAll: false, isDisabled: false, isPart: true });
    wrapper.instance().onCheckAll();
    expect(wrapper.state().checkStatus).toEqual({ isAll: true, isDisabled: false, isPart: false });
  });

  // 过滤搜索结果方式选择
  it('test onViewChange', async () => {
    const V_ALL = 'all'; // 全部结果
    const V_CHECK = 'selected'; // 查看已选结果
    const wrapper = init();

    wrapper.setProps({ nodes: mockRes });
    wrapper.instance().onViewChange(V_CHECK);
    expect(wrapper.state().viewType).toBe(V_CHECK);
    expect(wrapper.state().checkedCache).toEqual(mockRes.map(v => v.id));

    wrapper.instance().onViewChange(V_ALL);
    expect(wrapper.state().viewType).toBe(V_ALL);
    expect(wrapper.state().checkedCache).toEqual([]);
  });

  // 点击搜索结果标题
  it('test onTitleClick', async () => {
    const wrapper = init(defaultProps);
    const spyExplore = jest.spyOn(wrapper.instance().props, 'onToExplore');

    // 画布上不存在
    wrapper.instance().onTitleClick(mockRes[0]);
    expect(spyExplore.mock.calls[0][0]).toEqual([mockRes[0]]);
    spyExplore.mockRestore();

    // 画布上已存在
    wrapper.setProps({ nodes: [mockRes[0]] });
    wrapper.instance().onTitleClick(mockRes[0]);
    expect(spyExplore.mock.calls[0]).toEqual([[mockRes[0]], false]);
    spyExplore.mockRestore();
  });

  // 查看进出边详情
  it('test onSeeDetail', async () => {
    const wrapper = init(defaultProps);

    await wrapper.instance().onSeeDetail(mockRes[0]);
    expect(wrapper.state().baseInfo).toEqual(mockRes[0]);
    expect(wrapper.state().sumInfo).toEqual(mockE);
  });

  // 获取分析报告
  it('test getReport', async () => {
    const wrapper = init(defaultProps);

    await wrapper.instance().getReport(mockRes[0]);
    expect(wrapper.state().anylysisTitle).toBe(mockRes[0].name);

    servicesExplore.analysisReportGet.mockImplementationOnce(() =>
      Promise.resolve({ ErrorCode: 'EngineServer.ErrNebulaStatsErr' })
    );
    await wrapper.instance().getReport(mockRes[0]);
    expect(document.querySelector('.ant-message')).toBeTruthy();

    servicesExplore.analysisReportGet.mockImplementationOnce(() =>
      Promise.resolve({ ErrorCode: 'EngineServer.ErrRightsErr' })
    );
    await wrapper.instance().getReport(mockRes[0]);
    expect(document.querySelector('.ant-message')).toBeTruthy();

    servicesExplore.analysisReportGet.mockImplementationOnce(() =>
      Promise.resolve({ ErrorCode: 'EngineServer.ErrInternalErr' })
    );
    await wrapper.instance().getReport(mockRes[0]);
    expect(document.querySelector('.ant-message')).toBeTruthy();
  });

  // 其他
  it('test trigger function', async () => {
    const wrapper = init();

    wrapper.instance().onClose();
    wrapper.instance().onClassChange(mockClass[0]);
    wrapper.instance().onPageChange(2);
    wrapper.instance().handleToExplore();
    wrapper.instance().setFilterVisible(true);
  });
});
