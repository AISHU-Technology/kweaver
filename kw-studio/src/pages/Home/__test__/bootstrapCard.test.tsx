import React from 'react';
import { shallow } from 'enzyme';
import BootstrapCard from '../Navigation/BootstrapCard';

const init = (props: any) => shallow(<BootstrapCard {...props} />);

describe('BootstrapCard', () => {
  it('component is exists', () => {
    const props = {
      dec: '',
      icon: '',
      title: '',
      backImage: '',
      onClick: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
