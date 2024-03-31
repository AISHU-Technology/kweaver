import React from 'react';

import { mount } from 'enzyme';

import PromptIcon from '../PromptIcon';

const defaultProps = { className: 'kw-mr-2', icon: '2', type: 'completion' };

const init = (props = defaultProps) => mount(<PromptIcon {...props} />);

describe('PromptIcon', () => {
  it('exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
