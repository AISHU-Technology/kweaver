import React from 'react';
import IntentionConfig from '../index';
import { mount } from 'enzyme';
import { knData } from './mockData';

const defaultProps = { knData };
const init = (props = defaultProps) => mount(<IntentionConfig {...props} />);

describe('UI test', () => {
  it('modal UI', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('Button').length).toBe(4);
  });
});
