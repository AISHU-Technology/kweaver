import React from 'react';
import { shallow } from 'enzyme';
import NewCreateEnityRightMenu from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<NewCreateEnityRightMenu />);
    shallow(<NewCreateEnityRightMenu props={{ rightSelect: 'taskList' }} />);
    shallow(<NewCreateEnityRightMenu props={{ rightSelect: 'gatherList' }} />);
    shallow(<NewCreateEnityRightMenu props={{ rightSelect: 'dataInfo' }} />);
  });
});
