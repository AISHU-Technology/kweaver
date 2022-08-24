import React from 'react';
import { shallow } from 'enzyme';
import SetAttr from '../SetAttr';

const init = (props = {}) => shallow(<SetAttr />);

describe('SetAttr', () => {
  it('test render', async () => {
    const wrapper = init();
  });
});
