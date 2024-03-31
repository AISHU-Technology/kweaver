import React from 'react';
import { shallow } from 'enzyme';
import Type2 from '../index';

const init = (props: any) => shallow(<Type2 {...props} />);

describe('Type2', () => {
  it('component is exists', () => {
    const props = { serviceId: '12', origin: {}, appid: '12' };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
