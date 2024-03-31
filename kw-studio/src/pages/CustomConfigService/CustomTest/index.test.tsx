import React from 'react';
import { shallow } from 'enzyme';
import CustomTest from './index';

const init = (props: any) => shallow(<CustomTest {...props} />);

describe('CustomTest', () => {
  it('component is exists', () => {
    const props = { knwData: {}, knwStudio: 'studio' };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
