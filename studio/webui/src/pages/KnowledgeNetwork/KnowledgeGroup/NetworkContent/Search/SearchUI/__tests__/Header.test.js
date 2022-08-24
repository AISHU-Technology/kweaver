import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import { mockGraph } from './mockData';
import Header from '../Header';

const init = (props = {}) => mount(<Header {...props} />);

describe('SearchUI/Header', () => {
  it('test render', async () => {
    const props = {
      graphData: mockGraph,
      selectGraph: mockGraph[0],
      onClose: jest.fn(),
      onChange: jest.fn()
    };
    const wrapper = init(props);
    const spyClose = jest.spyOn(props, 'onClose');
    const spyChange = jest.spyOn(props, 'onChange');

    // 正常渲染选中图谱
    expect(wrapper.find('.ant-select-selection-item').text()).toBe(props.selectGraph.kg_name);

    // 切换图谱
    act(() => {
      wrapper.find('.ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-item-option').at(1).simulate('click');
    });
    expect(spyChange).toHaveBeenCalled();

    // 点击关闭
    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
    expect(spyClose).toHaveBeenCalled();
  });
});
