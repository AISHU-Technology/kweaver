import React from 'react';
import { shallow } from 'enzyme';
import NodeInfo from '../NodeInfo';

const init = (props = {}) => shallow(<NodeInfo />);

describe('NodeInfo', () => {
  it('test render', async () => {
    const wrapper = init();
  });
});
