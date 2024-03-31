import React from 'react';
import { shallow } from 'enzyme';
import DBApi from './index';

const init = (props: any) => shallow(<DBApi {...props} />);

describe('DBApi', () => {
  it('component is exists', () => {
    const props = { knData: {} };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
