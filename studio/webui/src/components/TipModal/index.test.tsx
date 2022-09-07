import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import TipModal, { tipModalFunc, knowModalFunc } from './index';

describe('tipModal', () => {
  it('test TipModal component', async () => {
    const defaultProps = {
      visible: true,
      title: 'title',
      content: 'content',
      onOk: jest.fn(),
      onCancel: jest.fn()
    };
    const wrapper = mount(<TipModal {...defaultProps} />);
    const spyOk = jest.spyOn(wrapper.props(), 'onOk');
    const spyCancel = jest.spyOn(wrapper.props(), 'onCancel');
    expect(wrapper.find('.t-text').text()).toBe(defaultProps.title);
    expect(wrapper.find('.m-body').text()).toBe(defaultProps.content);
    act(() => {
      wrapper.find('.cancel-btn').first().simulate('click');
      wrapper.find('.ok-btn').first().simulate('click');
    });
    expect(spyOk).toHaveBeenCalled();
    expect(spyCancel).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('test knowModalFunc', async () => {
    knowModalFunc.open({ content: 'content' });
    await sleep();
    expect(document.querySelector('.ant-modal-confirm-content')!.innerHTML).toBe('content');
    knowModalFunc.close();
  });

  it('test tipModalFunc', async () => {
    const title = '标题';
    const content = '提示内容';
    const okText = '确认按钮';
    const cancelText = '取消按钮';
    const modalPromise = tipModalFunc({ title, content, okText, cancelText });
    await sleep();

    const modal = document.querySelector('.ant-modal')!;
    const okBtn = modal.querySelector('.ant-btn-primary')!;
    const cancelBtn = modal.querySelector('.ant-btn:not(.ant-btn-primary)')!;
    expect(modal.querySelector('.ant-modal-confirm-title')!.innerHTML).toBe(title);
    expect(modal.querySelector('.ant-modal-confirm-content')!.innerHTML).toBe(content);
    expect(okBtn.innerHTML).toContain(okText);
    expect(cancelBtn.innerHTML).toContain(cancelText);

    act(() => {
      okBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    modalPromise.then(isOk => expect(isOk).toBe(true));
  });
});
