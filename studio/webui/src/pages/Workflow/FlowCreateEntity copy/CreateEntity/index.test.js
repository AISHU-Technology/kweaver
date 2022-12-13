import React from 'react';
import { shallow } from 'enzyme';
import NewCreateEntity from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<NewCreateEntity />);
  });
});
