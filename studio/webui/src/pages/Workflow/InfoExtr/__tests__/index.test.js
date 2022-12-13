import React from 'react';
import { mount } from 'enzyme';
import { sleep, act } from '@/tests';
import store from '@/reduxConfig/store';
import {
  mockStep2Data,
  mockStep3Data,
  mockStep4Data,
  mockModels,
  mockDirPre,
  mockFilePre,
  mockSheet
} from './mockData';
import servicesCreateEntity from '@/services/createEntity';
import serviceWorkflow from '@/services/workflow';
import InfoExtr from '../index';

// 获取模型
servicesCreateEntity.fetchModelList = jest.fn(() => Promise.resolve({ res: mockModels }));
// 下一步
serviceWorkflow.graphEdit = jest.fn(() => Promise.resolve({ res: 'success' }));
// 文件夹预览
servicesCreateEntity.getChildrenFile = jest.fn(() => Promise.resolve({ res: mockDirPre }));
// 文件预览或数据表预览
servicesCreateEntity.getOtherPreData = jest.fn(({ id }) =>
  Promise.resolve(id === 2 ? { res: mockSheet } : mockFilePre)
);
serviceWorkflow.graphGet = jest.fn(() => Promise.resolve({ res: { graph_otl: [{ id: 1 }] } }));
servicesCreateEntity.getEntityInfo = jest.fn(() => Promise.resolve({ res: { df: mockStep3Data } }));

const defaultProps = {
  next: jest.fn(),
  prev: jest.fn(),
  graphId: 1,
  current: 0,
  useDs: [],
  setUseDs: jest.fn(),
  infoExtrData: [],
  setInfoExtrData: jest.fn(),
  dataSourceData: [],
  ontoData: [],
  subscriptionState: jest.fn()
};
const init = (props = defaultProps) => mount(<InfoExtr {...props} store={store} />);
const initReady = () => {
  const props = {
    ...defaultProps,
    dataSourceData: mockStep2Data,
    ontoData: mockStep3Data,
    current: 2
  };

  return init(props);
};

describe('UI is render', () => {
  // 是否渲染
  it('should render', async () => {
    init();
    await sleep();
  });
});

describe('Function is called', () => {
  // 新建时初始化useEffect
  it('test useEffect when create', async () => {
    const wrapper = initReady();

    wrapper.setProps({ current: 3 });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.ds-item').length).toBe(mockStep3Data[0].entity.length);
  });

  // 编辑时初始化useEffect
  it('test useEffect when edit', async () => {
    const wrapper = initReady();

    wrapper.setProps({ infoExtrData: mockStep4Data, current: 3 });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.ds-item').length).toBe(mockStep3Data[0].entity.length + mockStep4Data.length);
  });

  // 点击下一步
  it('test next', async () => {
    const wrapper = initReady();

    wrapper.setProps({ current: 3 });
    await sleep();
    wrapper.update();

    const nextBtn = wrapper.find('.work-flow-footer Button').at(1);
    const spyNext = jest.spyOn(wrapper.props(), 'next');

    act(() => {
      nextBtn.simulate('click');
    });
    await sleep();
    expect(spyNext).toHaveBeenCalled();
  });

  // 点击上一步
  it('test prev', async () => {
    const wrapper = initReady();

    wrapper.setProps({ current: 3 });
    await sleep();
    wrapper.update();

    const prevBtn = wrapper.find('.work-flow-footer Button').at(0);
    const spyPrev = jest.spyOn(wrapper.props(), 'prev');

    act(() => {
      prevBtn.simulate('click');
    });
    expect(spyPrev).toHaveBeenCalled();
  });

  // 点击数据源列表
  it('test click source list', async () => {
    const wrapper = initReady();

    wrapper.setProps({ infoExtrData: mockStep4Data, current: 3 });
    await sleep();
    wrapper.update();

    const dsList = wrapper.find('.ds-item');

    // 文件夹预览
    act(() => {
      dsList.at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.show-board-file-name').at(0).text()).toBe(mockStep4Data[0].file_name);

    // 数据表预览
    act(() => {
      dsList.at(1).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.show-board-file-name').at(0).text()).toBe(mockStep3Data[0].entity[0].source_table[0]);

    // 文件预览
    act(() => {
      dsList.at(2).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(wrapper.find('.show-board-file-name').at(0).text()).toBe(mockStep3Data[0].entity[1].source_table[0][1]);
  });

  // 点击删除数据源
  it('test delete source', async () => {
    const wrapper = initReady();

    wrapper.setProps({ current: 3 });
    await sleep();
    wrapper.update();

    const delBtn = wrapper.find('.ds-item .trash-btn').at(0);

    act(() => {
      delBtn.simulate('click');
    });
    await sleep();
    wrapper.update();

    act(() => {
      const okBtn = document.querySelector('.ant-btn-primary');

      okBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await sleep(333);
    wrapper.update();
    expect(wrapper.find('.ds-item').length).toBe(mockStep3Data[0].entity.length - 1);
  });

  // 抽取规则
  it('test add rule', async () => {
    const wrapper = initReady();

    // 先打开一个数据源
    wrapper.setProps({ current: 3 });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ds-item').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();

    // 添加
    const addRuleIcon = wrapper.find('.extract-rule-add-icon .rule-add-icon').at(0);

    act(() => {
      addRuleIcon.simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.extract-item').length).toBe(mockStep3Data[0].entity[0].properties.length + 1);

    // 触发输入
    const { length } = wrapper.find('.extract-item input');

    act(() => {
      wrapper
        .find('.extract-item input')
        .at(length - 2)
        .simulate('change', { target: { value: '实体类名' } });
      wrapper
        .find('.extract-item input')
        .at(length - 1)
        .simulate('change', { target: { value: '属性字段' } });
    });
    wrapper.update();
    expect(
      wrapper
        .find('.extract-item input')
        .at(length - 2)
        .props().value
    ).toBe('实体类名');
    expect(
      wrapper
        .find('.extract-item input')
        .at(length - 1)
        .props().value
    ).toBe('属性字段');

    // 删除
    act(() => {
      wrapper.find('.extract-item-delete').last().simulate('click');
    });
    await sleep();
    wrapper.update();
    act(() => {
      const okBtn = document.querySelector('.ant-btn-primary');

      okBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await sleep(400);
    wrapper.update();
    expect(wrapper.find('.extract-item').length).toBe(mockStep3Data[0].entity[0].properties.length);
  });
});
