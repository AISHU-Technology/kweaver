import React from 'react';
import { shallow } from 'enzyme';
import AnalysisServiceConfig from '../index';

const defaultProps = {};
const init = (props = defaultProps) => shallow(<AnalysisServiceConfig {...props} />);

describe('AnalysisServiceConfig', () => {
  it('test', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
