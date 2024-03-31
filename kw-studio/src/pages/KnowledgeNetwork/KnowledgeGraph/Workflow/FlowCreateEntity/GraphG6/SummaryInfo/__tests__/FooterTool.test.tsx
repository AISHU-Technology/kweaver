import React from 'react';
import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';
import FooterTool, { FooterToolProps } from '../FooterTool';
import { mockGroupList } from '../../__tests__/mockData';

const defaultProps = {
  disabled: false,
  checked: false,
  indeterminate: false,
  groupList: mockGroupList,
  onCheckAll: jest.fn(),
  onDelete: jest.fn(),
  onGroupChange: jest.fn(),
  onCreateGroup: jest.fn()
};
const init = (props: FooterToolProps = defaultProps) => mount(<FooterTool {...props} />);

describe('SummaryInfo/FooterTool', () => {
  it('test disabled', () => {
    const wrapper = init();
    wrapper.setProps({ disabled: true });
    act(() => {
      wrapper.find('Button').first().simulate('click');
    });
    expect(wrapper.props().onDelete).toHaveBeenCalledTimes(0);
  });

  it('test select group', () => {
    const wrapper = init();
    // 打开Dropdown
    act(() => {
      wrapper.find('Button').last().simulate('click');
    });
    wrapper.update();
    // 选择
    act(() => {
      wrapper.find('.group-item').at(0).simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.group-item').at(0).hasClass('checked')).toBe(true);
    // 确认添加
    act(() => {
      wrapper
        .findWhere(node => node.text() === '确定')
        .at(0)
        .simulate('click');
    });
    expect(wrapper.props().onGroupChange).toHaveBeenCalled();
    // 取消
    act(() => {
      wrapper
        .findWhere(node => node.text() === '取消')
        .at(0)
        .simulate('click');
    });
  });

  it('test onCreateGroup', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('Button').last().simulate('click');
    });
    wrapper.update();
    act(() => {
      wrapper.find('.group-dropdown-content Button').simulate('click');
    });
    expect(wrapper.props().onCreateGroup).toHaveBeenCalled();
  });

  it('test delete and check callback', () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('Checkbox').first(), 'onChange');
    expect(wrapper.props().onCheckAll).toHaveBeenCalled();
    act(() => {
      wrapper.find('Button').first().simulate('click');
    });
    expect(wrapper.props().onDelete).toHaveBeenCalled();
  });

  // it('test search', async () => {
  //   const wrapper = init();
  //   act(() => {
  //     wrapper.find('Button').last().simulate('click');
  //   });
  //   wrapper.update();
  //   triggerPropsFunc(wrapper.find('SearchInput'), 'onChange', { persist: jest.fn(), target: { value: '分组' } });
  //   await sleep(333);
  //   wrapper.update();
  //   const searchResults = wrapper.find('.group-item .g-name');
  //   expect(searchResults.length).toBe(1);
  //   expect(searchResults.text().includes('分组')).toBe(true);
  // });
});
