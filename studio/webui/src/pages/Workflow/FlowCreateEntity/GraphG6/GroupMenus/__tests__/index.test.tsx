import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import servicesSubGraph from '@/services/subGraph';
import GroupMenus, { GroupMenusProps } from '../index';
import { mockGraph, mockGroupList } from '../../__tests__/mockData';

servicesSubGraph.subgraphDelete = jest.fn(() => Promise.resolve({ res: 'success' }));

const defaultProps = {
  graphId: 1,
  groupList: mockGroupList,
  graph: mockGraph,
  selectedData: { data: {} },
  operateGroup: {} as any,
  onSelect: jest.fn(),
  onAdd: jest.fn(),
  onDelete: jest.fn(),
  onCreate: jest.fn(),
  onEdit: jest.fn()
};
const init = (props: GroupMenusProps = defaultProps) => mount(<GroupMenus {...props} />);

describe('GroupMenus', () => {
  it('test open and close', async () => {
    const wrapper = init();
    expect(wrapper.find('.menus-close').exists()).toBe(false);
    act(() => {
      wrapper.find('.header .h-icon-mask').last().simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.menus-close').exists()).toBe(true);
  });

  it('test delete', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.delete-icon').simulate('click');
    });
    await sleep();
    wrapper.update();
    act(() => {
      const okBtn = document.querySelector('.ant-btn-primary')!;
      okBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await sleep();
    expect(wrapper.props().onDelete).toHaveBeenCalled();
  });
});
