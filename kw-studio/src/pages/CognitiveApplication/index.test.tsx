import React from 'react';
import { shallow } from 'enzyme';
import CognitiveApplication from './index';

const init = (props: any) => shallow(<CognitiveApplication {...props} />);

describe('CognitiveApplication', () => {
  it('component is exists', () => {
    const props = {};
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
