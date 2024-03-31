import React from 'react';
import { mount } from 'enzyme';
import SearchConfig from '../index';
import { knData } from './mockData';

const init = (props: any) => mount(<SearchConfig {...props} />);

describe('test UI', () => {
  it('test header', () => {
    const wrapper = init({ knData });
    expect(wrapper.exists()).toBe(true);
  });
});
