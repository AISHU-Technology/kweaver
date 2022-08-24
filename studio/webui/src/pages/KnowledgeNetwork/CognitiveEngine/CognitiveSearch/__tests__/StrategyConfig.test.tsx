import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import store from '@/reduxConfig/store';
import StrategyConfig, { StrategyConfigProps } from '../StrategyConfig';
import { mockGraphList, mockEditData, mockGraphData } from './mockData';

jest.mock('@/services/searchConfig', () => ({
  fetchConfigGraph: () => Promise.resolve(mockGraphList),
  fetchConfig: () => Promise.resolve(mockEditData),
  fetchCanvasData: () => Promise.resolve(mockGraphData),
  updateAdvConfig: () => Promise.resolve({ res: 'success' }),
  addAdvConfig: () => Promise.resolve({ res: 1 })
}));

const defaultProps = {
  type: 'create',
  kgData: { id: 1 },
  tabKey: '',
  editId: 0,
  anyDataLang: 'zh-CN',
  onTest: jest.fn(),
  onAfterSave: jest.fn(),
  notGraphCallback: jest.fn(),
  onClose: jest.fn()
};
const init = (props: StrategyConfigProps = defaultProps) => mount(<StrategyConfig {...props} store={store} />);

describe('CognitiveSearch/StrategyConfig', () => {
  it('test create', async () => {
    const wrapper = init();
    wrapper.setProps({ tabKey: 'config tab' });
    await sleep();
    wrapper.update();

    // 未选择
    act(() => {
      wrapper.find('.edit-btn').at(0).simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.graph-select').at(0).hasClass('border-error')).toBe(true);

    // 选择图谱
    act(() => {
      wrapper.find('.graph-select .ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-item-option').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();

    // 改变深度
    act(() => {
      wrapper.find('.add-btn').simulate('mousedown');
    });
    expect(wrapper.find('.deep-text').text().includes('二度关系')).toBe(true);

    // 重置按钮
    act(() => {
      wrapper.find('.reset-btn').at(0).simulate('click');
    });
    expect(wrapper.find('.deep-text').text().includes('一度关系')).toBe(true);

    // 打开配置弹窗
    act(() => {
      wrapper.find('.edit-btn').at(0).simulate('click');
    });
    expect(document.querySelector('.kg-strategy-config-modal')).toBeDefined();

    // 保存按钮
    act(() => {
      wrapper.find('.save-btn').at(0).simulate('click');
    });
    expect(document.querySelector('.kg-save-strategy-modal')).toBeDefined();
  });

  it('test edit', async () => {
    const wrapper = init();
    wrapper.setProps({ type: 'edit', tabKey: 'config tab', editId: 1 });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.config-row .ant-input').at(0).html().includes(mockEditData.res.conf_name)).toBe(true);

    // 编辑配置名
    act(() => {
      wrapper
        .find('.config-row .ant-input')
        .at(0)
        .simulate('change', { target: { value: '新的配置名' } });
    });

    // 保存按钮
    act(() => {
      wrapper.find('.save-btn').at(0).simulate('click');
    });
    await sleep();
    expect(document.querySelector('.ant-message')).toBeDefined();
  });
});
