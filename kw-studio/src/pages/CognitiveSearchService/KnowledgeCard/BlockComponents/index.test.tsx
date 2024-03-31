import React from 'react';
import { mount } from 'enzyme';
import BlockComponents from './index';

const defaultProps = {};
const init = (props = defaultProps) => mount(<BlockComponents {...props} />);

describe('BlockComponents', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
