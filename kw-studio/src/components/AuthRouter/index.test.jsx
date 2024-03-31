import React from 'react';
import { shallow } from 'enzyme';
import AuthorizedRoute from './index';

it('renders without crashing', () => {
  shallow(<AuthorizedRoute />);
});
