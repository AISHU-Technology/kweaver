import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import HelpTips from './index';

const defaultProps = { visible: false };
const init = (props = defaultProps) => mount(<HelpTips {...props} />);

describe('HelpTips', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.find('.graph-operation-help-tips').exists()).toBe(false);
    wrapper.setProps({ visible: true });
    wrapper.update();
    expect(wrapper.find('.graph-operation-help-tips').exists()).toBe(true);
    await sleep(3333);
    wrapper.update();
    expect(wrapper.find('.graph-operation-help-tips').exists()).toBe(false);
  });

  it('test not remind', async () => {
    const wrapper = init({ visible: true });
    act(() => {
      wrapper.find('.never-notify').simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.graph-operation-help-tips').exists()).toBe(false);

    const reWrapper = init({ visible: true });
    expect(reWrapper.find('.graph-operation-help-tips').exists()).toBe(false);
  });
});
