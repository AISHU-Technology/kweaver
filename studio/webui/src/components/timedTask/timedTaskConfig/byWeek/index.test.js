import React from 'react';
import { shallow } from 'enzyme';
import ByWeek from './index';

const wrapperShallow = shallow(<ByWeek />);
const instance = wrapperShallow.instance();

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<ByWeek />);
  });
});
