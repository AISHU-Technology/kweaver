import React from 'react';
import { shallow } from 'enzyme';
import IframeDocument from './index';

const init = (props: any) => shallow(<IframeDocument {...props} />);

describe('IframeDocument', () => {
  it('component is exists', () => {
    const props = {};
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
