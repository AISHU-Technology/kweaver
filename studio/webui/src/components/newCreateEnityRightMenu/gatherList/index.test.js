import React from 'react';
import { shallow } from 'enzyme';
import GatherList from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<GatherList />);
  });
});
