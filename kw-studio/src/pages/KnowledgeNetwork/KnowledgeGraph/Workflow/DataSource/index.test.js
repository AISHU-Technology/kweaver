import React from 'react';
import { shallow } from 'enzyme';
import DataSource from './index';

it('renders without crashing', () => {
  shallow(<DataSource />);
});
