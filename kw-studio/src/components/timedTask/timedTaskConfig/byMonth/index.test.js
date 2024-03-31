import React from 'react';
import { shallow } from 'enzyme';
import ByMonth from './index';

const wrapperShallow = shallow(<ByMonth />);
const instance = wrapperShallow.instance();

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<ByMonth />);
  });
});
