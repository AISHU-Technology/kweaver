import React from 'react';
import { shallow } from 'enzyme';
import Homepage from '../index';

const init = (props: any) => shallow(<Homepage {...props} />);

describe('Homepage', () => {
  it('component is exists', () => {
    const wrapper = init({});
    expect(wrapper.exists()).toBe(true);
  });
});
