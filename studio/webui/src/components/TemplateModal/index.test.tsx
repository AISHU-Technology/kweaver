import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import TemplateModal from './index';

describe('TemplateModal', () => {
  it('test', async () => {
    const onOK = jest.fn();
    const onCancel = jest.fn();
    const wrapper = mount(
      <TemplateModal visible title="标题" onOk={onOK} onCancel={onCancel}>
        内容
      </TemplateModal>
    );
    expect(wrapper.find('.m-header').text()).toBe('标题');
    expect(wrapper.find('.m-content').text()).toBe('内容');

    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
    act(() => {
      wrapper.find('Button').at(1).simulate('click');
    });
    expect(onOK).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();

    wrapper.setProps({ okText: '提交', cancelText: '关闭' });
    expect(wrapper.find('Button').at(0).text()).toBe('关闭');
    expect(wrapper.find('Button').at(1).text()).toBe('提交');

    wrapper.setProps({ header: null, footer: null });
    expect(wrapper.find('.m-header').exists()).toBe(false);
    expect(wrapper.find('.m-footer').exists()).toBe(false);

    wrapper.setProps({ header: <div className="mock-header" />, footer: <div className="mock-footer" /> });
    expect(wrapper.find('.mock-header').exists()).toBe(true);
    expect(wrapper.find('.mock-footer').exists()).toBe(true);
  });
});
