import React from 'react';
import { mount } from 'enzyme';
import ServiceDrawer from '../ServiceDrawer';
import { act } from '@/tests';

const defaultProps = {
  isDrawer: true,
  setIsDrawer: jest.fn(),
  serviceData: { name: '描述', description: '这是一个描述' }
};

const init = (props: any) => mount(<ServiceDrawer {...props} />);

describe('test UI', () => {
  it('drawer UI', () => {
    const wrapper = init(defaultProps);
    expect(wrapper.find('.title-modal').at(0).text()).toBe(defaultProps.serviceData.name);
    expect(wrapper.find('.drawer-content-head').at(0).text()).toBe(defaultProps.serviceData.description);
  });
  it('api UI', () => {
    const wrapper = init({ ...defaultProps, apiDrawer: 'key' });
    expect(wrapper.find('.title-modal').at(0).text()).toBe('APP key说明');
    expect(wrapper.find('.key-title').at(0).text()).toBe('KWeaver 认证介绍');
    expect(wrapper.find('.key-example').at(0).text()).toBe('使用实例');
    expect(wrapper.find('.key-algorithm').at(0).text()).toBe('APP Key 生成算法');
    expect(wrapper.find('.go-border').at(0).text()).toBe('Golang');
    expect(wrapper.find('.kw-pointer').at(1).text()).toBe('Python');
    expect(wrapper.find('.java-border').at(0).text()).toBe('JavaScript');
  });
});

describe('Function test', () => {
  it('test click', async () => {
    const wrapper = init({ ...defaultProps, apiDrawer: 'key' });
    act(() => {
      wrapper.find('.go-border').at(0).simulate('click');
    });
    act(() => {
      wrapper.find('.kw-pointer').at(1).simulate('click');
    });
    act(() => {
      wrapper.find('.java-border').at(0).simulate('click');
    });
  });
});
