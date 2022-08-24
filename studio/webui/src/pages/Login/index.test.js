import React from 'react';
import { shallow } from 'enzyme';
import store from '@/reduxConfig/store';
import Login from './index';

it('renders without crashing', () => {
  shallow(<Login store={store} />);
});
