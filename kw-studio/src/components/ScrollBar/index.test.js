import React from 'react';
import { shallow } from 'enzyme';
import ScrollBar from './index';

it('renders without crashing', () => {
  shallow(<ScrollBar />);
});
