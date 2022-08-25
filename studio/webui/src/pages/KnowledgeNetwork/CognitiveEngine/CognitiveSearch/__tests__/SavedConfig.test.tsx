import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import SavedConfig, { SavedConfigProps } from '../SavedConfig';
import { mockConfigList, mockEditData, mockGraphData } from './mockData';

jest.mock('@/services/searchConfig', () => ({
  fetchConfigList: () => Promise.resolve(mockConfigList),
  fetchConfig: () => Promise.resolve(mockEditData),
  fetchCanvasData: () => Promise.resolve(mockGraphData),
  deleteAdvConfig: () => Promise.resolve({ res: 'success' })
}));
jest.mock('../ConfigModal', () => (props = {}) => {
  const MockConfigModal: any = () => <div />;
  return <MockConfigModal className="mock-config-modal" {...props} />;
});

const defaultProps = {
  tabKey: '',
  kgData: { id: 1 },
  isManager: true,
  onEdit: jest.fn(),
  notConfigCallback: jest.fn()
};
const init = (props: SavedConfigProps = defaultProps) => mount(<SavedConfig {...props} />);

describe('CognitiveSearch/SavedConfig', () => {
  it('test checked', async () => {
    const wrapper = init();
    wrapper.setProps({ tabKey: 'saved tab' });
    await sleep();
    wrapper.update();

    // 点击图谱选中第一个配置
    act(() => {
      wrapper.find('.g-check .ant-checkbox-input').at(0).simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.g-check').at(0).props().checked).toBe(true);
    expect(wrapper.find('.list-row .ant-radio').at(0).hasClass('ant-radio-checked')).toBe(true);

    // 反选配置, 图谱同时取消
    act(() => {
      wrapper.find('.c-radio .ant-radio-input').at(0).simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.g-check').at(0).props().checked).toBe(false);
    expect(wrapper.find('.list-row .ant-radio').at(0).hasClass('ant-radio-checked')).toBe(false);

    // 清除
    act(() => {
      wrapper.find('.c-radio .ant-radio-input').at(1).simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.list-row .ant-radio').at(1).hasClass('ant-radio-checked')).toBe(true);
    act(() => {
      wrapper.find('.clear-icon').simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.list-row .ant-radio').at(1).hasClass('ant-radio-checked')).toBe(false);
  });

  it('test dropdown operation', async () => {
    const wrapper = init();
    wrapper.setProps({ tabKey: 'saved tab' });
    await sleep();
    wrapper.update();

    // 点击省略号icon展开下拉菜单
    act(() => {
      wrapper.find('.panel-header').at(0).simulate('click');
    });
    wrapper.update();
    act(() => {
      wrapper.find('.list-row .ellipsis-btn').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.list-row').at(0).hasClass('checked')).toBe(true);

    // 点击查看
    act(() => {
      wrapper.find('.ant-dropdown-menu-item').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect((wrapper.find('.mock-config-modal').at(0).props() as Record<string, any>).visible).toBe(true);

    // 删除
    act(() => {
      wrapper.find('.ant-dropdown-menu-item').last().simulate('click');
    });
    act(() => {
      const okBtn = document.querySelector('.ad-tip-modal .ant-btn-primary');
      okBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await sleep();
    expect(document.querySelector('.ant-message')).toBeDefined();
  });
});
