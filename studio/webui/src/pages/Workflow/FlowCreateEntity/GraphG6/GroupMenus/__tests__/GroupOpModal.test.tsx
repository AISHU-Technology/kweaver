import React from 'react';
import { mount } from 'enzyme';
import { act, sleep, triggerPropsFunc } from '@/tests';
import GroupOpModal from '../GroupOpModal';
import { mockGroupList } from '../../__tests__/mockData';

const defaultProps = {
  visible: true,
  type: 'create',
  group: {} as any,
  onOk: jest.fn(),
  onCancel: jest.fn()
};
const init = (props = defaultProps) => mount(<GroupOpModal {...props} />);

describe('GroupMenus/GroupOpModal', () => {
  it('test render', () => {
    const wrapper = init();
    expect(wrapper.find('TemplateModal').props().title).toBe('新建分组');
    wrapper.setProps({
      type: 'edit',
      group: mockGroupList[0]
    });
    wrapper.update();
    expect(wrapper.find('Input').props().value).toBe(mockGroupList[0].name);
  });

  it('test verification', async () => {
    const wrapper = init();
    const spyOk = jest.spyOn(wrapper.props(), 'onOk');
    // 空
    triggerPropsFunc(wrapper.find('TemplateModal'), 'onOk');
    await sleep();
    expect(spyOk).toHaveBeenCalledTimes(0);

    // 特殊字符
    act(() => {
      wrapper.find('Input').simulate('change', { target: { value: '#￥%' } });
    });
    triggerPropsFunc(wrapper.find('TemplateModal'), 'onOk');
    await sleep();
    expect(spyOk).toHaveBeenCalledTimes(0);

    // 黑名单
    act(() => {
      wrapper.find('Input').simulate('change', { target: { value: '未分组' } });
    });
    triggerPropsFunc(wrapper.find('TemplateModal'), 'onOk');
    await sleep();
    expect(spyOk).toHaveBeenCalledTimes(0);

    // 超出长度
    act(() => {
      wrapper.find('Input').simulate('change', { target: { value: '1'.repeat(51) } });
    });
    triggerPropsFunc(wrapper.find('TemplateModal'), 'onOk');
    await sleep();
    expect(spyOk).toHaveBeenCalledTimes(0);

    // 正常
    act(() => {
      wrapper.find('Input').simulate('change', { target: { value: '新建分组' } });
    });
    triggerPropsFunc(wrapper.find('TemplateModal'), 'onOk');
    await sleep();
    expect(spyOk).toHaveBeenCalled();
  });
});
