import React from 'react';
import { shallow } from 'enzyme';
import store from '@/reduxConfig/store';
import Home from './index';

jest.mock('@/components/Header', () => () => null);
jest.mock('./SideBar', () => () => null);

const init = props => shallow(<Home {...props} />);

it('renders without crashing', () => {
  const props = { store };
  const wrapper = init(props);
  expect(wrapper.exists()).toBe(true);
});
