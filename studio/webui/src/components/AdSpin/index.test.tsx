import React from 'react';
import { mount } from 'enzyme';
import AdSpin from './index';

const init = (props = {}) => mount(<AdSpin {...props} />);

describe('AdSpin', () => {
  it('test', async () => {
    const props = { className: 'test' };
    const wrapper = init(props);
    expect(wrapper.hasClass(props.className)).toBe(true);
    expect(wrapper.find('.spin-desc').exists()).toBe(false);
    wrapper.setProps({ desc: 'loading' });
    expect(wrapper.find('.spin-desc').text()).toBe('loading');
  });
});
