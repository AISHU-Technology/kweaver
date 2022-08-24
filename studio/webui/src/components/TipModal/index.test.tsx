import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import { tipModalFunc } from './index';

describe('tipModalFunc', () => {
  it('test tipModalFunc', async () => {
    const title = '标题';
    const content = '提示内容';
    const okText = '确认按钮';
    const cancelText = '取消按钮';

    // 判断error类型弹窗
    const modalPromise = tipModalFunc({ title, content, okText, cancelText });

    await sleep();

    const modal = document.querySelector('.ant-modal')!;
    const okBtn = modal.querySelector('.ant-btn-primary')!;
    const cancelBtn = modal.querySelector('.ant-btn:not(.ant-btn-primary)')!;

    expect(modal.querySelector('.ant-modal-confirm-title')!.innerHTML).toBe(title);
    expect(modal.querySelector('.ant-modal-confirm-content')!.innerHTML).toBe(content);
    expect(okBtn.innerHTML).toContain(okText);
    expect(cancelBtn.innerHTML).toContain(cancelText);

    // 点击确定
    act(() => {
      okBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    modalPromise.then(isOk => expect(isOk).toBe(true));
  });
});
