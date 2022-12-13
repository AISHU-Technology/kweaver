import React from 'react';
import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';
import GroupTree from '../GroupTree';
import { TREE_TYPE } from '../GroupTree/assistFunction';
import { mockGraph, mockGroupList } from '../../__tests__/mockData';

const defaultProps = {
  groupList: mockGroupList,
  selectedData: { data: {} },
  operateGroup: {} as any,
  onSelect: jest.fn(),
  onAdd: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn()
};
const init = (props = defaultProps) => mount(<GroupTree {...props} />);

describe('GroupMenus/GroupTree', () => {
  it('test selected keys', async () => {
    const wrapper = init();
    wrapper.setProps({ operateGroup: mockGroupList[0] });
    wrapper.update();
    expect((wrapper.find('Tree').props() as any).selectedKeys).toEqual([mockGroupList[0].id]);
    const selectedData = { group: mockGroupList[0], data: mockGraph.nodes[0] };
    wrapper.setProps({ selectedData });
    wrapper.update();
    expect((wrapper.find('Tree').props() as any).selectedKeys).toEqual([
      mockGroupList[0].id,
      `entity-${selectedData.group.id}-${selectedData.data.uid}`
    ]);
  });

  it('test select', async () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('Tree'), 'onSelect', [], { node: { type: TREE_TYPE.entity_class } });
    expect(wrapper.props().onSelect).toHaveBeenCalledTimes(0);
    triggerPropsFunc(wrapper.find('Tree'), 'onSelect', [], { node: { type: TREE_TYPE.entity } });
    expect(wrapper.props().onSelect).toHaveBeenCalled();
  });
});
