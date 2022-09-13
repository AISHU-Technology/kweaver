import React from 'react';
import { shallow } from 'enzyme';
import NotFound from './index';

it('renders without crashing', () => {
  shallow(<NotFound />);
});
