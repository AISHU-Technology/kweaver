import React from 'react';
import { shallow } from 'enzyme';
import Navigation from '../Navigation';

const init = (props: any) => shallow(<Navigation {...props} />);

describe('Navigation', () => {
  it('component is exists', () => {
    const wrapper = init({});
    expect(wrapper.exists()).toBe(true);
  });
});
