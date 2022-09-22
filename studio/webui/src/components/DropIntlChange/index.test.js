import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import DropIntlChange from './index';
import Cookies from 'js-cookie';

const init = () => mount(<DropIntlChange />);

describe('DropIntlChange', () => {
  it('test render', async () => {
    Object.defineProperty(window, 'location', {
      value: { reload: jest.fn() }
    });
    const wrapper = init();
    // default zh-CN
    expect(wrapper.state().lang).toBe('zh-CN');
    // change en-US
    act(() => {
      wrapper.find('.change-language-content').simulate('click');
    });
    await sleep();
    wrapper.update();
    act(() => {
      document
        .querySelectorAll('.change-language-overlay .ant-dropdown-menu-item')[1]
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(wrapper.state().lang).toBe('en-US');
    expect(Cookies.get('anyDataLang')).toBe('en-US');
  });
});
