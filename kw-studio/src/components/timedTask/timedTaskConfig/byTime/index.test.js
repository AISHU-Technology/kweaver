import React from 'react';
import { shallow } from 'enzyme';
import ByTime from './index';

const wrapperShallow = shallow(<ByTime />);
const instance = wrapperShallow.instance();

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<ByTime />);
  });
});
