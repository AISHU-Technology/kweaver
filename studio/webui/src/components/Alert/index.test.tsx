import React from 'react';
import { mount } from 'enzyme';
import Alert from './index';

const init = (props: any) => mount(<Alert {...props} />);

describe('Alert', () => {
  it('class alertRoot is exists', () => {
    const wrapper = init({});
    expect(wrapper.find('.alertRoot').exists()).toBe(true);
  });
});
