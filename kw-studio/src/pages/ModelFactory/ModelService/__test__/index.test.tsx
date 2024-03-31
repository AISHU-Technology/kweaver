import React from 'react';
import { mount } from 'enzyme';
import ModelService from '../index';

const defaultProps = { kgData: {} };

const init = (props = defaultProps) => mount(<ModelService {...props} />);

describe('function init', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
