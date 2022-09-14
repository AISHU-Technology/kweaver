import React from 'react';
import { shallow } from 'enzyme';
import TimedTask from './index';

const wrapperShallow = shallow(<TimedTask />);
const instance = wrapperShallow.instance();

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<TimedTask />);
  });
});
