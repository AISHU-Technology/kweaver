import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import servicesSearchConfig from '@/services/searchConfig';

import { mockPro } from './mockData';
import FilterModal from '../FilterModal';

// 获取所有属性
servicesSearchConfig.entityPropertiesGet = jest.fn(() => Promise.resolve({ res: mockPro }));

const defaultPorps = {
  visible: true,
  graphId: 1,
  selectClass: { class: '标签' },
  setVisible: jest.fn(),
  onOk: jest.fn()
};
const init = (props = {}) => mount(<FilterModal {...props} />);

describe('SearchUI/FilterModal', () => {
  /**
   * selector选择器切换函数
   * @param {Object} wrapper 包装器
   * @param {Number} optionIndex 切换选项索引
   * @param {Number} selectIndex 选择器索引, 第1列属性, 第2列条件范围
   */
  const selectChange = async (wrapper, optionIndex = 0, selectIndex = 0) => {
    act(() => {
      wrapper.find('.ant-select-selector').at(selectIndex).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper
        .find('.ant-select-dropdown')
        .at(selectIndex)
        .find('.ant-select-item-option')
        .at(optionIndex)
        .simulate('click');
    });
    wrapper.update();

    return wrapper;
  };

  // 未选择图谱或实体
  it('test no class', () => {
    init();
  });

  // 正常初始化、未添加
  it('test init', async () => {
    const wrapper = init(defaultPorps);

    await sleep();

    // 添加更多按钮错误
    act(() => {
      wrapper.find('.add-more').simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.err-msg').text()).toBe('请先添加');

    // 开始筛选错误
    act(() => {
      wrapper.find('.ant-btn-primary').simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.err-msg').text()).toBe('不能为空');
  });

  // 选择属性
  it('test onProChange', async () => {
    let wrapper = init(defaultPorps);

    await sleep();
    for (let i = 0; i < mockPro.length; i++) {
      wrapper = await selectChange(wrapper, i);
      expect(wrapper.find('.ant-select-selection-item').at(0).text()).toBe(mockPro[i].p_name);
    }
  });

  // 选择筛选范围
  it('test onRangeChange', async () => {
    let wrapper = init(defaultPorps);
    const intIndex = mockPro.findIndex(item => item.p_type === 'INTEGER');

    await sleep();

    // 选择int类型, 默认介于, 切换 [小于, 介于, 大于, 等于]
    wrapper = await selectChange(wrapper, intIndex);
    expect(wrapper.find('.range-select .ant-select-selection-item').at(0).text()).toBe('介于');

    wrapper = await selectChange(wrapper, 0, 1);
    expect(wrapper.find('.range-select .ant-select-selection-item').at(0).text()).toBe('小于');

    wrapper = await selectChange(wrapper, 2, 1);
    expect(wrapper.find('.range-select .ant-select-selection-item').at(0).text()).toBe('大于');

    wrapper = await selectChange(wrapper, 3, 1);
    expect(wrapper.find('.range-select .ant-select-selection-item').at(0).text()).toBe('等于');
  });

  // 字符串
  it('test string', async () => {
    let wrapper = init(defaultPorps);
    const index = mockPro.findIndex(item => item.p_type === 'STRING');
    const spyOk = jest.spyOn(wrapper.props(), 'onOk');

    await sleep();
    wrapper = await selectChange(wrapper, index);
    act(() => {
      wrapper
        .find('.input-value-box .ant-input')
        .at(0)
        .simulate('change', { target: { value: '测试' } });
      wrapper.find('.ant-btn-primary').simulate('click');
    });
    expect(spyOk.mock.calls[0][0]).toEqual([
      {
        pro: mockPro[index].p_name,
        type: mockPro[index].p_type,
        rangeType: '=',
        isErr: false,
        value: ['测试']
      }
    ]);
    spyOk.mockRestore();
  });

  // 数字类型
  it('test number', async () => {
    let wrapper = init(defaultPorps);
    const index = mockPro.findIndex(item => item.p_type === 'DOUBLE');
    const spyOk = jest.spyOn(wrapper.props(), 'onOk');

    await sleep();
    wrapper = await selectChange(wrapper, index);
    act(() => {
      wrapper
        .find('.ant-input-number-input')
        .at(0)
        .simulate('change', { target: { value: '1' } });
      wrapper
        .find('.ant-input-number-input')
        .at(1)
        .simulate('change', { target: { value: '2' } });
      wrapper.find('.ant-btn-primary').simulate('click');
    });

    expect(spyOk.mock.calls[0][0]).toEqual([
      {
        pro: mockPro[index].p_name,
        type: mockPro[index].p_type,
        rangeType: '~',
        isErr: false,
        value: ['1', '2']
      }
    ]);
    spyOk.mockRestore();
  });

  // 删除
  it('test delete', async () => {
    let wrapper = init(defaultPorps);

    await sleep();

    // 单个删除
    wrapper = await selectChange(wrapper, 0);
    act(() => {
      wrapper.find('.del-btn').simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.input-value-box').exists()).toBe(false);

    // 一键清除
    wrapper = await selectChange(wrapper, 0);
    act(() => {
      wrapper.find('.footer Button').at(0).simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.input-value-box').exists()).toBe(false);
  });
});
