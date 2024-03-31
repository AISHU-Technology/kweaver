import React from 'react';
import { shallow } from 'enzyme';
import CustomCreateStep from './index';

const init = (props: any) => shallow(<CustomCreateStep {...props} />);

describe('CustomCreateStep', () => {
  it('component is exists', () => {
    const props = { knwData: {}, knwStudio: 'studio', setKnwStudio: () => {} };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
