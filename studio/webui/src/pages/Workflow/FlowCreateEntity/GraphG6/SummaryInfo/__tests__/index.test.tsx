import React from 'react';
import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';
import SummaryInfo, { SummaryInfoProps } from '../index';
import GraphNodeList from '../GraphNodeList';
import { mockGraph, mockGroupList } from '../../__tests__/mockData';

GraphNodeList.displayName = 'GraphNodeList';
jest.mock('../FooterTool', () => {
  const FooterTool = () => null;
  FooterTool.displayName = 'FooterTool';
  return FooterTool;
});

const defaultProps = {
  graph: mockGraph,
  groupList: mockGroupList,
  onClose: jest.fn(),
  onDelete: jest.fn(),
  onUpdateGraphData: jest.fn(),
  setSelectedElement: jest.fn(),
  onCreateGroup: jest.fn()
};
const init = (props: SummaryInfoProps = defaultProps) => mount(<SummaryInfo {...props} />);

describe('SummaryInfo', () => {
  it('test init', async () => {
    const wrapper = init();
    const NodeList = wrapper.find('GraphNodeList').first();
    expect(NodeList.props().data).toEqual(mockGraph.nodes);
  });

  it('test search', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('GraphNodeList').first(), 'onSearch', '空');
    expect(wrapper.findWhere(node => node.text() === '抱歉，没有找到相关内容').exists()).toBe(true);
    triggerPropsFunc(wrapper.find('GraphNodeList').first(), 'onSearch', '点类1');
    const { data } = wrapper.find('GraphNodeList').first().props() as any;
    expect(data.some((d: any) => d.alias.includes('点类1'))).toBe(true);
  });

  it('test click row', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('GraphNodeList').first(), 'onRowClick');
    expect(wrapper.props().setSelectedElement).toHaveBeenCalled();
  });

  it('test change page', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('GraphNodeList').first(), 'onPageChange', 2);
    const { page } = wrapper.find('GraphNodeList').first().props() as any;
    expect(page).toBe(1);
  });

  it('test check', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('GraphNodeList').first(), 'onCheck', true, mockGraph.nodes[0]);
    const { selectedValues } = wrapper.find('GraphNodeList').first().props() as any;
    expect(selectedValues).toEqual([mockGraph.nodes[0].uid]);
  });

  it('test check all', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('FooterTool'), 'onCheckAll', true);
    const { selectedValues } = wrapper.find('GraphNodeList').first().props() as any;
    expect(selectedValues).toEqual(mockGraph.nodes.map(d => d.uid));
  });

  it('test onCreateGroup', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('FooterTool'), 'onCreateGroup');
    expect(wrapper.props().onCreateGroup).toHaveBeenCalled();
  });

  it('test onGroupChange', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('FooterTool'), 'onGroupChange', []);
    expect(wrapper.props().onUpdateGraphData).toHaveBeenCalled();
  });
});
