import React from 'react';
import { mount } from 'enzyme';
import SelectEdgeClass from './index';
import { act, sleep } from '@/tests';

const defaultProps = {
  value: ['document'],
  classList: [
    {
      alias: '文档',
      color: '#5c539b',
      default_tag: 'name',
      entity_id: 1,
      icon: 'graph-model',
      name: 'document'
    },
    {
      alias: '正文',
      color: '#d770a1',
      default_tag: 'name',
      entity_id: 2,
      icon: 'graph-model',
      name: 'text'
    }
  ],
  onChange: jest.fn()
};
const init = (props = defaultProps) => mount(<SelectEdgeClass {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('test checkbox', () => {
  it('checkbox change', async () => {
    const wrapper = init();

    act(() => {
      wrapper.find('.ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper
        .find('.ant-checkbox')
        .at(0)
        .simulate('change', { target: { checked: true } });
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-checkbox').at(1).simulate('click');
    });
  });
});
