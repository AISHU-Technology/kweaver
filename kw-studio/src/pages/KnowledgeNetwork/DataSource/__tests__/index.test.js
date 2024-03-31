import React from 'react';
import { shallow } from 'enzyme';
import store from '@/reduxConfig/store';
import DataSource from '../index';

it('renders without crashing', () => {
  shallow(<DataSource store={store} />);
});
