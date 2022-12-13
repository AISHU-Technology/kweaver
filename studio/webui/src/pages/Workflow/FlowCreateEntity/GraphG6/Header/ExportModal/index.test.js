import React from 'react';
import { shallow } from 'enzyme';
import ExportModal from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<ExportModal />);
  });
});
