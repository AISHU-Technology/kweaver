import React from 'react';
import { shallow } from 'enzyme';
import CognitiveSearchIframe from '../CognitiveSearchIframe';

describe('IframeBase/CognitiveSearchIframe', () => {
  it('test render', async () => {
    const wrapper = shallow(<CognitiveSearchIframe />);
    expect(wrapper.exists()).toBe(true);
  });
});
