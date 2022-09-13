import React from 'react';
import { shallow } from 'enzyme';
import BottomPagination from './index';

it('renders without crashing', () => {
  shallow(<BottomPagination />);
});
