import React from 'react';
import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';
import GraphNodeList, { GraphNodeListProps } from '../GraphNodeList';
import { mockGraph } from '../../__tests__/mockData';

const defaultProps = {
  type: 'node',
  data: [],
  selectedValues: [],
  errorMark: [],
  rowKey: 'uid',
  page: 1,
  pageSize: 10,
  total: 0,
  onPageChange: jest.fn(),
  onRowClick: jest.fn(),
  onCheck: jest.fn(),
  onSearch: jest.fn(),
  onDelete: jest.fn()
};
const init = (props: GraphNodeListProps = defaultProps) => mount(<GraphNodeList {...props} />);

describe('SummaryInfo/GraphNodeList', () => {
  it('test render', () => {
    const { nodes } = mockGraph;
    const wrapper = init();
    expect(wrapper.findWhere(node => node.text() === '抱歉，没有找到相关内容').exists()).toBe(true);
    wrapper.setProps({ data: nodes, total: nodes.length });
    expect(wrapper.find('.list-item').length).toBe(mockGraph.nodes.length);
  });

  it('test controller value', () => {
    const { edges } = mockGraph;
    const wrapper = init();
    wrapper.setProps({
      type: 'edge',
      data: edges,
      total: edges.length,
      selectedValues: [edges[0].uid],
      errorMark: [edges[0].uid]
    });
    const row0 = wrapper.find('.list-item').at(0);
    expect(row0.hasClass('checked')).toBe(true);
    expect(row0.hasClass('error')).toBe(true);
  });

  it('test callback', async () => {
    const { nodes } = mockGraph;
    const wrapper = init();
    wrapper.setProps({ data: nodes, total: nodes.length });
    // 点击行
    act(() => {
      wrapper.find('.list-item .info-wrap').at(0).simulate('click');
    });
    expect(wrapper.props().onRowClick).toHaveBeenCalled();
    // 点击复选框
    act(() => {
      wrapper.find('.check-wrap').at(0).simulate('click');
    });
    expect(wrapper.props().onCheck).toHaveBeenCalled();
    // 点击删除
    act(() => {
      wrapper.find('.delete-mask').at(0).simulate('click');
    });
    expect(wrapper.props().onDelete).toHaveBeenCalled();
    // 触发搜索
    triggerPropsFunc(wrapper.find('SearchInput'), 'onChange', { persist: jest.fn(), target: { value: '搜索' } });
    await sleep(333);
    expect(wrapper.props().onSearch).toHaveBeenCalled();
  });
});
