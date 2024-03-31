import React from 'react';
import { shallow } from 'enzyme';
import Test from './index';

const init = (props: any) => shallow(<Test {...props} />);

describe('Test', () => {
  it('component is exists', () => {
    const props = { actuatorData: {}, inOutResult: [], serviceInfo: {}, setInOutResult: () => {} };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
