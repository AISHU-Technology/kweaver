import React from 'react';
import { shallow } from 'enzyme';
import store from '@/reduxConfig/store';
import DataBase from './index';

const init = (props = {}) => shallow(<DataBase store={store} {...props} />);

describe('function test', () => {
  it('test function basic', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
