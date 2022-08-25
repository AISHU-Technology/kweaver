import React from 'react';
import { shallow } from 'enzyme';
import ByDay from './index';

const wrapperShallow = shallow(<ByDay />);
const instance = wrapperShallow.instance();

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<ByDay />);
  });
});
