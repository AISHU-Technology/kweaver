import React from 'react';
import { shallow } from 'enzyme';
import CognitiveSearch from '../index';

describe('CognitiveSearch', () => {
  it('render', async () => {
    const wrapper = shallow(<CognitiveSearch knData={{ id: 1 }} />);
    expect(wrapper.exists()).toBe(true);
  });
});
