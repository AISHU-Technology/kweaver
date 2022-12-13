import React from 'react';
import { mount } from 'enzyme';
import TopSteps from './index';

const init = (props = {}) => mount(<TopSteps {...props} />);

describe('TopSteps', () => {
  it('test render', async () => {
    const wrapper = init({ current: 0 });
    expect(wrapper.find('.step-item').at(0).hasClass('progress')).toBe(true);
    wrapper.setProps({ current: 1 });
    expect(wrapper.find('.step-item').at(0).hasClass('finish')).toBe(true);
  });
});
