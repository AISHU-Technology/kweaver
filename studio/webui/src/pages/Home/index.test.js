import React from 'react';
import { shallow } from 'enzyme';
import store from '@/reduxConfig/store';
import Home from './index';

jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn(), location: { pathname: '' }, listen: jest.fn() }),
  useLocation: () => ({ pathname: '', search: '' }),
  withRouter: () => jest.fn()
}));

it('renders without crashing', () => {
  shallow(<Home store={store} />);
});
