import React from 'react';

import { mount } from 'enzyme';

import PromptManageConfig from '..';

const init = () => mount(<PromptManageConfig />);
describe('test Exists', () => {
  it('exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
