import React from 'react';
import { mount } from 'enzyme';
import { mockRes } from './mockData';
import BaseInfo from '../BaseInfo';

const init = (props = {}) => mount(<BaseInfo {...props}/>);

describe('SearchUI/BaseInfo', () => {
  it('test render', async () => {
    const wrapper = init();

    wrapper.setProps({ data: mockRes[0] });
    expect(wrapper.find('.cl-name').text()).toBe(mockRes[0].name);
    expect(wrapper.find('.row').length).toBe(mockRes[0].properties.length);
  });
});
