import React from 'react';
import { shallow } from 'enzyme';
import store from '@/reduxConfig/store';
import App from './router';

const init = () => shallow(<App store={store} />);

describe('App', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
