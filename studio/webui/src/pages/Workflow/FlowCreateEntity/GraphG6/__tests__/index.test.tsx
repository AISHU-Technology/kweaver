import React from 'react';
import { mount } from 'enzyme';
import type { ReactWrapper } from 'enzyme';
import _ from 'lodash';
import { act, sleep, triggerPropsFunc } from '@/tests';
import servicesSubGraph from '@/services/subGraph';
import GraphG6 from '../index';
import { mockGraph, mockGroupList } from './mockData';

import Header from '../Header';
import CanvasG6 from '../CanvasG6';
import NodeInfo from '../NodeInfo';
import EdgeInfo from '../EdgeInfo';
import TaskList from '../TaskList';
import SummaryInfo from '../SummaryInfo';
import GroupMenus from '../GroupMenus';
import GroupOpModal from '../GroupMenus/GroupOpModal';
import BrushSelectDialog from '../BrushSelectDialog';
import HelpTips from '../HelpTips';
import Footer from '../Footer';
(Header as any).displayName = 'Header';
(CanvasG6 as any).displayName = 'CanvasG6';
(NodeInfo as any).displayName = 'NodeInfo';
(EdgeInfo as any).displayName = 'EdgeInfo';
(TaskList as any).displayName = 'TaskList';
(SummaryInfo as any).displayName = 'SummaryInfo';
(GroupMenus as any).displayName = 'GroupMenus';
(GroupOpModal as any).displayName = 'GroupOpModal';
(BrushSelectDialog as any).displayName = 'BrushSelectDialog';
(HelpTips as any).displayName = 'HelpTips';
(Footer as any).displayName = 'Footer';

jest.mock('@/services/subGraph', () => ({
  subGraphGetList: jest.fn(() => Promise.resolve({ res: mockGroupList })),
  subgraphAdd: jest.fn(() => Promise.resolve({ res: { subgraph_id: 9 } })),
  subgraphEdit: jest.fn(() => Promise.resolve({ res: 'success' }))
}));

const defaultProps = {
  childRef: { current: undefined },
  current: 2,
  osId: 1,
  dbType: 'nebula',
  graphId: 1,
  ontoData: [
    {
      entity: mockGraph.nodes,
      edge: mockGraph.edges,
      id: 1,
      ontology_des: '',
      ontology_name: '',
      used_task: []
    }
  ],
  graphName: '图谱名称',
  ontologyId: 1,
  next: jest.fn(),
  prev: jest.fn()
};
const init = (props = defaultProps) => mount(<GraphG6 {...props} />);
const getProps = (wrap: ReactWrapper, name: string) => wrap.find(name).props() as any;

describe('GraphG6', () => {
  it('test init', async () => {
    const wrapper = init();
    await sleep();
    // 是否在ref上暴露了getFlowData方法
    expect(_.has(wrapper.props().childRef.current, 'getFlowData')).toBe(true);
    expect(_.has(wrapper.props().childRef.current.getFlowData(), 'ontoBody')).toBe(true);

    // 是否初始化了分组信息
    const { graphData } = getProps(wrapper, 'CanvasG6');
    expect(graphData.nodes.some((node: any) => _.has(node, '_group'))).toBe(true);
  });

  // 一些更新数据的回调
  it('test update state callback', async () => {
    const wrapper = init();
    await sleep();
    // 切换模式
    triggerPropsFunc(wrapper.find('CanvasG6'), 'onChangePattern', 'brushSelect');
    expect(getProps(wrapper, 'CanvasG6').graphPattern).toBe('brushSelect');

    // 切换汇总信息面板
    expect(wrapper.find('SummaryInfo').exists()).toBe(false);
    triggerPropsFunc(wrapper.find('Header'), 'onChangeOperationKey', 'summaryInfo');
    expect(wrapper.find('SummaryInfo').exists()).toBe(true);

    // 切换任务列表面板
    expect(getProps(wrapper, 'TaskList').visible).toBe(false);
    triggerPropsFunc(wrapper.find('Header'), 'onChangeOperationKey', 'taskList');
    expect(getProps(wrapper, 'TaskList').visible).toBe(true);

    // 切换编辑点面板
    expect(wrapper.find('NodeInfo').exists()).toBe(false);
    triggerPropsFunc(wrapper.find('CanvasG6'), 'onChangeSelectedItem', mockGraph.nodes[0]);
    expect(wrapper.find('NodeInfo').exists()).toBe(true);

    // 切换编辑边面板
    expect(wrapper.find('EdgeInfo').exists()).toBe(false);
    triggerPropsFunc(wrapper.find('CanvasG6'), 'onChangeSelectedItem', mockGraph.edges[0]);
    expect(wrapper.find('EdgeInfo').exists()).toBe(true);
  });

  // 更新图数据
  it('test update graph', async () => {
    const wrapper = init();
    await sleep();
    const getGraph = () => getProps(wrapper, 'CanvasG6').graphData;

    // 添加点
    triggerPropsFunc(wrapper.find('Header'), 'headerAddData', {
      type: 'node',
      items: [{ name: 'testAddNode', color: '#000' }]
    });
    await sleep();
    expect(getGraph().nodes.some((d: any) => d.name === 'testAddNode')).toBe(true);

    // 添加边
    const addNodes = getGraph().nodes;
    triggerPropsFunc(wrapper.find('Header'), 'onAddEdgesBatch', [
      {
        startId: addNodes[0].uid,
        endId: addNodes[1].uid,
        name: 'testAddEdge',
        color: '#000',
        startName: addNodes[0].name,
        endName: addNodes[1].name
      }
    ]);
    await sleep();
    expect(getGraph().edges.some((d: any) => d.name === 'testAddEdge')).toBe(true);

    // 修改
    const updateNode = getGraph().nodes[0];
    triggerPropsFunc(wrapper.find('CanvasG6'), 'onChangeSelectedItem', updateNode);
    triggerPropsFunc(wrapper.find('NodeInfo'), 'detailUpdateData', {
      type: 'all',
      items: [{ ...updateNode, name: 'testUpdateName' }]
    });
    await sleep();
    expect(getGraph().nodes[0].name).toBe('testUpdateName');

    // 删除
    const deleteGraph = getGraph();
    triggerPropsFunc(wrapper.find('Header'), 'onChangeOperationKey', 'summaryInfo');
    triggerPropsFunc(wrapper.find('SummaryInfo'), 'onDelete', {
      type: 'node',
      items: deleteGraph.nodes.map((d: any) => d.uid)
    });
    triggerPropsFunc(wrapper.find('SummaryInfo'), 'onDelete', {
      type: 'edge',
      items: deleteGraph.edges.map((d: any) => d.uid)
    });
    await sleep();
    expect(getGraph()).toEqual({ nodes: [], edges: [] });
  });

  it('test add group', async () => {
    const wrapper = init();
    await sleep();
    (servicesSubGraph.subGraphGetList as any).mockImplementationOnce(() =>
      Promise.resolve({
        res: [
          {
            id: 9,
            name: '新分组',
            entity: [],
            edge: [],
            entity_num: 0,
            edge_num: 0
          },
          ...mockGroupList
        ]
      })
    );
    triggerPropsFunc(wrapper.find('GroupMenus'), 'onCreate');
    triggerPropsFunc(wrapper.find('BrushSelectDialog'), 'onOk');
    triggerPropsFunc(wrapper.find('GroupOpModal').at(0), 'onOk', 'create', { name: '新分组' });
    await sleep();
    wrapper.update();
    const { groupList } = getProps(wrapper, 'GroupMenus');
    expect(groupList.some((g: any) => g.name === '新分组')).toBe(true);
  });

  it('test edit group', async () => {
    const wrapper = init();
    await sleep();
    (servicesSubGraph.subGraphGetList as any).mockImplementationOnce(() => {
      const group0 = { ...mockGroupList[0], name: '新的分组名称' };
      return Promise.resolve({ res: [group0, ...mockGroupList.slice(1)] });
    });
    triggerPropsFunc(wrapper.find('GroupMenus'), 'onEdit', mockGroupList[0]);
    triggerPropsFunc(wrapper.find('GroupOpModal').at(0), 'onOk', 'edit', { ...mockGroupList[0], name: '新的分组名称' });
    await sleep();
    wrapper.update();
    const { groupList } = getProps(wrapper, 'GroupMenus');
    const updatedGroup = groupList.find((g: any) => g.id === mockGroupList[0].id);
    expect(updatedGroup.name).toBe('新的分组名称');
  });
});
