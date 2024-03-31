import React from 'react';
import { shallow } from 'enzyme';
import Alert from './index';

const init = (props: any) => shallow(<Alert {...props} />);

describe('Alert', () => {
  it('class alertRoot is exists', () => {
    const wrapper = init({});
    expect(wrapper.find('.alertRoot').exists()).toBe(true);
  });
});
