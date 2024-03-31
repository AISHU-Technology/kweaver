import React from 'react';
import { shallow } from 'enzyme';
import TopHeader from './index';

const init = (props: any) => shallow(<TopHeader {...props} />);

describe('TopHeader', () => {
  it('component is exists', () => {
    const props = { selectValue: {}, onChange: () => {}, setKnwStudio: () => {} };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
