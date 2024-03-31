import React from 'react';
import { shallow } from 'enzyme';
import Type1 from '../index';

const init = (props: any) => shallow(<Type1 {...props} />);

describe('Type1', () => {
  it('component is exists', () => {
    const props = { origin: {}, serviceId: '12', appid: '12', serviceData: {}, openAppidModal: {} };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
