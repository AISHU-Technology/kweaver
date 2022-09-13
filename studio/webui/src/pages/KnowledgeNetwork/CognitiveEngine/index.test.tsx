import React from 'react';
import { shallow } from 'enzyme';
import CognitiveEngine from './index';

const defaultProps = {
  kgData: {}
};
const init = (props = defaultProps) => shallow(<CognitiveEngine {...props} />);

describe('CognitiveEngine', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
